<?php
function handleSliders($method, $pathParts) {
    if ($method !== 'GET') {
        jsonResponse(['success' => false, 'message' => 'Phuong thuc khong duoc ho tro'], 405);
    }

    $sliders = queryAll(
        "SELECT id, title, subtitle, image_url, link, button_text, sort_order
         FROM sliders
         WHERE is_active = 1
           AND (start_date IS NULL OR start_date <= NOW())
           AND (end_date IS NULL OR end_date >= NOW())
         ORDER BY sort_order ASC, id DESC"
    );

    jsonResponse(['success' => true, 'data' => $sliders]);
}
?>
