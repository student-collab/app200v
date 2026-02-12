<?php
/* Heia Proton Lumo
 * Denne er strengt tatt ikke nødvendig
 * Den lar scriptet logge inn med en service-token heller enn 
 * å være avhengig av tillatelse for anonym autentisering
 * --------------------------------------------------------------
 * get-token.php – Production‑ready token generator for Firebase
 *
 *  • Reads a service‑account JSON file (kept outside the web root)
 *  • Builds a JWT (RS256) with the required claims
 *  • Signs the JWT with the private key
 *  • Exchanges the JWT for an OAuth access token
 *  • Returns a stable JSON payload:
 *        { success:true, access_token:"...", expires_in:3600 }
 *    or on error:
 *        { success:false, error:"human readable message" }
 *
 *  Security notes
 *  • CORS is locked to your own domain (replace example.com)
 *  • Service‑account file must be chmod 600 and live outside public_html
 *  • No debug output – all errors are captured and returned as JSON
 * -------------------------------------------------------------- */


declare(strict_types=1);
$rawPath = __DIR__ . '/../../../webroots/r1434796/FireBaseRTdb_JSON_key/app200v-team11-f5ac094ecc12.json';
$SAP = realpath($rawPath);
define('SERVICE_ACCOUNT_PATH',$SAP);
define('ALLOWED_ORIGIN','https://lbd247.no');
 
// ----------------------------------------------------------------
// Helper: base64url encode (no padding, URL‑safe)
// ----------------------------------------------------------------
function base64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    // ----------------------------------------------------------------
    // Helper: JSON response + correct HTTP status
    // ----------------------------------------------------------------
    function json_response(array $payload, int $httpStatus = 200): void
    {
        http_response_code($httpStatus);
        header('Content-Type: application/json; charset=utf-8');
        // Tighten CORS – only allow your own front‑end origin
        header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
        // Optional: allow only GET/POST if you want to be stricter
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        echo json_encode($payload);
        exit;
        }
        
        // ----------------------------------------------------------------
        // Main logic – wrapped in a try/catch so we always return JSON
        // ----------------------------------------------------------------
        try {
            // ------------------------------------------------------------
            // 1️⃣ Load and validate the service‑account JSON
            // ------------------------------------------------------------
            if (!file_exists(SERVICE_ACCOUNT_PATH)) {
                throw new RuntimeException('Service‑account key file not found');
                }
                
                $keyJson = file_get_contents(SERVICE_ACCOUNT_PATH);
                $keyData = json_decode($keyJson, true, 512, JSON_THROW_ON_ERROR);
                if (empty($keyData['private_key']) || empty($keyData['client_email'])) {
                    throw new RuntimeException('Invalid service‑account JSON – missing fields');
                    }
                    
                    // ------------------------------------------------------------
                    // 2️⃣ Build JWT header & payload
                    // ------------------------------------------------------------
                    $now = time();
                    
                    $header = [
                        'alg' => 'RS256',
                        'typ' => 'JWT'
                        ];
                        
                        $payload = [
                            'iss'   => $keyData['client_email'],
                            'scope' => 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
                            'aud'   => 'https://oauth2.googleapis.com/token',
                            'exp'   => $now + 3600,   // 1 hour validity (Google max)
                            'iat'   => $now
                            ];
                            
                            // Encode header & payload (base64url, no padding)
                            $headerEncoded  = base64url_encode(json_encode($header, JSON_UNESCAPED_SLASHES));
                            $payloadEncoded = base64url_encode(json_encode($payload, JSON_UNESCAPED_SLASHES));

    // ------------------------------------------------------------
    // 3️⃣ Sign the JWT (RS256 = SHA‑256 with RSA private key)
    // ------------------------------------------------------------
    $signatureInput = $headerEncoded . '.' . $payloadEncoded;

    $privateKeyRes = openssl_pkey_get_private($keyData['private_key']);
    if ($privateKeyRes === false) {
        throw new RuntimeException('Unable to load private key');
    }

    $signed = '';
    $ok = openssl_sign(
        $signatureInput,
        $signed,
        $privateKeyRes,
        OPENSSL_ALGO_SHA256
    );
    openssl_free_key($privateKeyRes);

    if (!$ok) {
        throw new RuntimeException('Failed to sign JWT: ' . openssl_error_string());
    }

    $signatureEncoded = base64url_encode($signed);
    $jwt = $signatureInput . '.' . $signatureEncoded;

    // ------------------------------------------------------------
    // 4️⃣ Exchange JWT for an OAuth access token
    // ------------------------------------------------------------
    $tokenEndpoint = 'https://oauth2.googleapis.com/token';
    $postFields = http_build_query([
        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion'  => $jwt
    ]);

    $ch = curl_init($tokenEndpoint);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $postFields,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2
    ]);

    $rawResponse = curl_exec($ch);
    $httpCode    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr     = curl_error($ch);
    curl_close($ch);

    if ($rawResponse === false) {
        throw new RuntimeException('cURL error while contacting token endpoint: ' . $curlErr);
    }

    if ($httpCode !== 200) {
        // Try to surface the error returned by Google
        $decoded = json_decode($rawResponse, true);
        $msg = $decoded['error_description'] ?? $decoded['error'] ?? 'Unknown error';
        throw new RuntimeException("Token endpoint returned HTTP {$httpCode}: {$msg}");
    }

    $tokenData = json_decode($rawResponse, true, 512, JSON_THROW_ON_ERROR);
    if (empty($tokenData['access_token']) || !isset($tokenData['expires_in'])) {
        throw new RuntimeException('Malformed token response from Google');
    }

    // ------------------------------------------------------------
    // 5️⃣ Success – return the token to the caller
    // ------------------------------------------------------------
    json_response([
        'success'      => true,
        'access_token' => $tokenData['access_token'],
        'expires_in'   => $tokenData['expires_in']
    ], 200);

} catch (Throwable $e) {
    // ------------------------------------------------------------
    // 6️⃣ Any error ends up here – we always return JSON
    // ------------------------------------------------------------
    json_response([
        'success' => false,
        'error'   => $e->getMessage()
    ], 500);
}