<?php
/* ============================================================
   AasanCode — Form to Email (PHP, no third-party service)
   Works on any PHP hosting (cPanel etc).

   SETUP:
   1. Upload this file to: php/send-mail.php (same folder as before)
   2. $TO_EMAIL / $FROM_EMAIL are set below to info@aasancode.com
   3. IMPORTANT: info@aasancode.com must exist as a real mailbox
      in cPanel > Email Accounts — otherwise mail() will "succeed"
      silently but nothing will ever arrive.
   ============================================================ */

$TO_EMAIL   = "info@aasancode.com";   // where enquiries arrive
$FROM_EMAIL = "info@aasancode.com";   // must be a real mailbox on this domain
$SITE_NAME  = "AasanCode Solutions";

/* ---------------- do not edit below ---------------- */
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

// Only allow requests from your own website (blocks other sites abusing this endpoint)
$allowed_hosts = ['aasancode.com', 'www.aasancode.com', 'localhost'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
if ($origin !== '') {
  $host = parse_url($origin, PHP_URL_HOST) ?? '';
  if (!in_array($host, $allowed_hosts)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Forbidden']); exit;
  }
}

// Simple rate limit: max 1 message per 30 seconds per visitor
session_start();
if (isset($_SESSION['last_sent']) && (time() - $_SESSION['last_sent']) < 30) {
  http_response_code(429);
  echo json_encode(['ok' => false, 'error' => 'Please wait a moment']); exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) { $data = $_POST; }

$name     = trim($data['name'] ?? '');
$email    = trim($data['email'] ?? '');
$phone    = trim($data['phone'] ?? '');
$message  = trim($data['message'] ?? '');
$interest = trim($data['interest'] ?? '');
$trap     = trim($data['website'] ?? ''); // honeypot — bots fill it, humans never see it

if ($trap !== '') { echo json_encode(['ok' => true]); exit; } // silently drop bots
if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Invalid input']); exit;
}

// SECURITY: strip newlines from anything that goes into email headers/subject
$clean = function($v, $len){ return substr(preg_replace('/[\r\n\t]+/', ' ', strip_tags($v)), 0, $len); };
$name     = $clean($name, 100);
$interest = $clean($interest, 100);
$email    = $clean($email, 150);
$phone    = $clean($phone, 20);
$message  = substr(strip_tags($message), 0, 3000); // body only — newlines here are fine

$subject = "New enquiry from $name — $SITE_NAME";
$body  = "New website enquiry\n";
$body .= "-------------------\n";
$body .= "Name: $name\n";
$body .= "Email: $email\n";
if ($phone) $body .= "Mobile: $phone\n";
if ($interest) $body .= "Interested in: $interest\n";
$body .= "Message:\n$message\n";
$body .= "-------------------\n";
$body .= "Sent: " . date('d M Y, h:i A') . " | IP: " . ($_SERVER['REMOTE_ADDR'] ?? '');

$headers  = "From: $SITE_NAME <$FROM_EMAIL>\r\n";
$headers .= "Reply-To: $name <$email>\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$sent = @mail($TO_EMAIL, $subject, $body, $headers);
if ($sent) { $_SESSION['last_sent'] = time(); }
echo json_encode(['ok' => (bool)$sent]);