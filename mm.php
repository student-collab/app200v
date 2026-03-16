<?php


// Exclude POST
if (strcmp ($_SERVER['REQUEST_METHOD'],'GET') !== 0 ) {
    http_response_code(405);
    exit('Method Not Allowed');
}

// Not so secret header stopping automated attacs
$expected_secret = 'www-w3schools-com-jsref-prop_doc_cookie-asp'; 
$provided_secret = $_SERVER['HTTP_X_INTERNAL_SECRET'] ?? '';
/*
PHP automatically transforms incoming header names:
Prefixes with HTTP_
Converts to uppercase
Replaces hyphens - with underscores _

client-side : headers: {'X-Internal-Secret'
becomes: HTTP_X_INTERNAL_SECRET
*/

if (!hash_equals($expected_secret, $provided_secret)) {
    http_response_code(403);
    exit('Forbidden');
}

const $RAW_PATH = __DIR__ . '/../../../webroots/r1434796/FireBaseRTdb_JSON_key';
$path = realpath($RAW_PATH);

if ($path === false) {
    http_response_code(500);
    exit('Internal Server Error: path not resolved');
}

const $GET_TOKEN = $path . '/get-token.php';

if (!is_file($GET_TOKEN)) {
    http_response_code(500);
    exit('Internal Server Error: target not found');
}

require_once $GET_TOKEN;


/**
 * get-token.php (GET_TOKEN) writes to file: TOKEN_CACHE_FILE
 * And the token data is available in $tokenData : $tokenData['access_token'], $tokenData['expiresAt']
 * 
 */
 //$tokenData
/*
Stoppet her litt usikker på hvordan jeg vil sende responsen,,, 


   http_response_code($httpStatus);
        header('Content-Type: application/json; charset=utf-8');
        // Tighten CORS – only allow your own front‑end origin
        header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
        // Optional: allow only GET/POST if you want to be stricter
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        echo json_encode($payload);
*/
header('Content-Type: application/json');
echo json_encode($tokenData); 