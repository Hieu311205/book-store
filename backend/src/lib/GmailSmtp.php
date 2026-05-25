<?php
/**
 * GmailSmtp.php — SMTP client thuần PHP để gửi email qua Gmail (cổng 587, STARTTLS).
 *
 * VAI TRÒ TRONG KIẾN TRÚC:
 *   Lớp hạ tầng (infrastructure layer) ở backend. Được gọi bởi các service cần
 *   gửi email (ví dụ: OTP, đặt lại mật khẩu). Không phụ thuộc PHPMailer hay bất
 *   kỳ thư viện ngoài nào — chỉ dùng socket PHP thuần.
 *
 * LUỒNG DỮ LIỆU (data flow):
 *   Caller (OtpService / PasswordResetService)
 *     → GmailSmtp::send()
 *       → fsockopen  (TCP plain-text đến smtp.gmail.com:587)
 *       → EHLO       (xác nhận server)
 *       → STARTTLS   (yêu cầu nâng cấp kết nối)
 *       → stream_socket_enable_crypto  (bắt tay TLS thực sự)
 *       → EHLO lại   (re-negotiate sau TLS)
 *       → AUTH LOGIN (gửi username + password dạng base64)
 *       → MAIL FROM / RCPT TO / DATA  (truyền nội dung thư)
 *       → QUIT       (đóng phiên SMTP)
 *     → Gmail relay  → hộp thư người nhận
 *
 * LƯU Ý BẢO MẬT:
 *   - $pass phải là "App Password" 16 ký tự của Google (không phải mật khẩu chính).
 *   - verify_peer = false vì nhiều môi trường dev không có CA bundle; cần bật lại ở production.
 */
class GmailSmtp {
    private string $host = 'smtp.gmail.com';
    private int    $port = 587;
    private string $user;
    private string $pass;  // Gmail App Password (16 chars, no spaces)

    /**
     * Khởi tạo client với thông tin xác thực Gmail.
     * Input:  $user — địa chỉ Gmail gửi đi; $pass — App Password.
     * Output: instance sẵn sàng gọi send().
     */
    public function __construct(string $user, string $pass) {
        $this->user = $user;
        $this->pass = $pass;
    }

    /**
     * Gửi một email văn bản thuần (plain-text) đến người nhận.
     *
     * Input:
     *   $toEmail  — địa chỉ email đích
     *   $toName   — tên hiển thị người nhận (được encode UTF-8 base64 trong header)
     *   $subject  — tiêu đề thư (encode tương tự)
     *   $body     — nội dung thư (encode base64, chia dòng 76 ký tự theo RFC 2045)
     *
     * Output: void — ném RuntimeException nếu bất kỳ bước SMTP nào thất bại.
     *
     * Side-effect: mở và đóng kết nối TCP đến smtp.gmail.com:587 trong mỗi lần gọi.
     *
     * @throws \RuntimeException on any SMTP error
     */
    public function send(string $toEmail, string $toName, string $subject, string $body): void {
        // Kết nối TCP plain-text trước; STARTTLS sẽ nâng cấp lên TLS ở bước sau.
        // verify_peer=false để tránh lỗi CA trên môi trường không có SSL bundle đầy đủ.
        $ctx = stream_context_create(['ssl' => [
            'verify_peer'      => false,
            'verify_peer_name' => false,
        ]]);

        $sock = @stream_socket_client(
            "tcp://{$this->host}:{$this->port}",
            $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $ctx
        );
        if (!$sock) {
            throw new \RuntimeException("SMTP connect failed: {$errstr} ({$errno})");
        }
        stream_set_timeout($sock, 15);

        // Bước 1: Đọc greeting 220 từ server (bắt buộc trước khi gửi lệnh nào)
        $this->expect($sock, 220, 'greeting');

        // Bước 2: EHLO — giới thiệu client, server trả về danh sách tính năng hỗ trợ
        $this->cmd($sock, "EHLO bookstore.local");
        $this->readAll($sock);

        // Bước 3: Yêu cầu STARTTLS — server đồng ý nâng cấp kết nối lên TLS
        $this->cmd($sock, "STARTTLS");
        $this->expect($sock, 220, 'STARTTLS');

        // Bước 4: Bắt tay TLS thực sự trên socket đã mở sẵn.
        // Thử TLSv1.2 trước; nếu server không hỗ trợ thì fallback về bất kỳ TLS nào.
        if (!stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT)) {
            // Fall back to any TLS version
            if (!stream_socket_enable_crypto($sock, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                fclose($sock);
                throw new \RuntimeException("TLS handshake failed");
            }
        }

        // Bước 5: EHLO lại sau TLS — server có thể công bố thêm tính năng chỉ cho phép qua TLS
        $this->cmd($sock, "EHLO bookstore.local");
        $this->readAll($sock);

        // Bước 6: AUTH LOGIN — giao thức yêu cầu gửi username rồi password,
        // mỗi giá trị được encode base64 riêng biệt (không phải một lúc).
        $this->cmd($sock, "AUTH LOGIN");
        $this->expect($sock, 334, 'AUTH LOGIN');

        $this->cmd($sock, base64_encode($this->user));
        $this->expect($sock, 334, 'username');

        $this->cmd($sock, base64_encode($this->pass));
        $this->expect($sock, 235, 'password'); // 235 = xác thực thành công

        // Bước 7: Khai báo người gửi và người nhận với server relay của Gmail
        $this->cmd($sock, "MAIL FROM:<{$this->user}>");
        $this->expect($sock, 250, 'MAIL FROM');

        $this->cmd($sock, "RCPT TO:<{$toEmail}>");
        $this->expect($sock, 250, 'RCPT TO');

        // Bước 8: Gửi nội dung thư (header + body) — kết thúc bằng dấu chấm đơn trên dòng riêng (\r\n.\r\n)
        $this->cmd($sock, "DATA");
        $this->expect($sock, 354, 'DATA');

        $date       = date('r');
        // Encode tiêu đề và tên người nhận sang UTF-8 Base64 theo RFC 2047
        // để các ký tự ngoài ASCII (tiếng Việt) hiển thị đúng trong ứng dụng email
        $subjectEnc = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $nameEnc    = '=?UTF-8?B?' . base64_encode($toName)  . '?=';
        $message    = "Date: {$date}\r\n"
                    . "From: Book Store <{$this->user}>\r\n"
                    . "To: {$nameEnc} <{$toEmail}>\r\n"
                    . "Subject: {$subjectEnc}\r\n"
                    . "MIME-Version: 1.0\r\n"
                    . "Content-Type: text/plain; charset=UTF-8\r\n"
                    . "Content-Transfer-Encoding: base64\r\n"
                    . "\r\n"
                    // chunk_split chia base64 thành các dòng 76 ký tự — yêu cầu của RFC 2045
                    . chunk_split(base64_encode($body), 76, "\r\n")
                    . "\r\n.\r\n"; // Dấu chấm đơn báo hiệu kết thúc DATA

        fwrite($sock, $message);
        $this->expect($sock, 250, 'message accepted');

        // Bước 9: Đóng phiên SMTP đúng cách — tránh để server đóng kết nối trước
        $this->cmd($sock, "QUIT");
        fclose($sock);
    }

    /**
     * Ghi một lệnh SMTP vào socket (tự động thêm CRLF theo chuẩn RFC 5321).
     * Input: $line — lệnh SMTP chưa có CRLF. Side-effect: ghi vào socket.
     */
    private function cmd(mixed $sock, string $line): void {
        fwrite($sock, $line . "\r\n");
    }

    /**
     * Đọc toàn bộ phản hồi nhiều dòng từ server SMTP vào một chuỗi.
     *
     * Giao thức SMTP cho phép server trả về nhiều dòng; dòng cuối cùng có ký tự
     * thứ 4 là dấu cách (ví dụ "250 OK"), các dòng trung gian có dấu gạch ngang
     * (ví dụ "250-STARTTLS"). Hàm dừng khi gặp dòng cuối.
     *
     * Input: socket đang mở. Output: toàn bộ phản hồi dạng string.
     */
    private function readAll(mixed $sock): string {
        $out = '';
        while ($line = fgets($sock, 512)) {
            $out .= $line;
            // Single-line or last line of multi-line: 4th char is a space
            if (strlen($line) >= 4 && $line[3] === ' ') break;
        }
        return $out;
    }

    /**
     * Đọc phản hồi và kiểm tra mã trạng thái SMTP có đúng như mong đợi không.
     *
     * Input:  $sock — socket; $code — mã SMTP kỳ vọng (ví dụ 250, 334);
     *         $ctx — nhãn mô tả bước SMTP (dùng trong thông báo lỗi).
     * Output: chuỗi phản hồi thô nếu đúng mã.
     * Side-effect: ném RuntimeException nếu mã thực tế khác mã kỳ vọng,
     *              giúp caller biết chính xác bước nào thất bại.
     */
    private function expect(mixed $sock, int $code, string $ctx): string {
        $line   = $this->readAll($sock);
        $actual = (int)substr($line, 0, 3);
        if ($actual !== $code) {
            throw new \RuntimeException(
                "SMTP [{$ctx}]: expected {$code}, got {$actual}: " . trim($line)
            );
        }
        return $line;
    }
}
?>
