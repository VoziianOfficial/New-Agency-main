<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
| Change these two values when installing the site on a new hosting account.
*/
$recipientEmail = 'hello@novaperformance.agency';
$companyName = 'NOVA Performance';

ini_set('display_errors', '0');
ini_set('html_errors', '0');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');

$successMessage = 'Thank you. Your request has been sent successfully.';

function respondJson($success, $message, $statusCode, array $errors = array())
{
    http_response_code($statusCode);

    $payload = array(
        'success' => (bool) $success,
        'message' => (string) $message,
    );

    if (!empty($errors)) {
        $payload['errors'] = $errors;
    }

    echo json_encode(
        $payload,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );

    exit;
}

function postString($key)
{
    if (!isset($_POST[$key]) || !is_scalar($_POST[$key])) {
        return '';
    }

    return trim((string) $_POST[$key]);
}

function containsHeaderInjection($value)
{
    return preg_match('/(?:\r|\n|%0a|%0d)/i', $value) === 1;
}

function cleanSingleLine($value)
{
    $value = trim(strip_tags((string) $value));
    $value = preg_replace('/[ \t\r\n]+/', ' ', $value);

    return $value === null ? '' : trim($value);
}

function cleanMessage($value)
{
    $value = trim(strip_tags((string) $value));
    $value = preg_replace("/\r\n|\r|\n/", "\n", $value);

    return $value === null ? '' : trim($value);
}

function textLength($value)
{
    return strlen($value);
}

function isValidEmailAddress($email)
{
    if ($email === '' || containsHeaderInjection($email)) {
        return false;
    }

    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function safeHeaderValue($value)
{
    $value = cleanSingleLine($value);

    return containsHeaderInjection($value) ? '' : $value;
}

function safeHost()
{
    $host = isset($_SERVER['HTTP_HOST']) ? (string) $_SERVER['HTTP_HOST'] : 'localhost';
    $host = preg_replace('/:\d+$/', '', $host);
    $host = preg_replace('/[^a-zA-Z0-9.-]/', '', (string) $host);
    $host = trim((string) $host, '.-');

    return $host !== '' ? $host : 'localhost';
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');

    respondJson(
        false,
        'Method not allowed. Please submit the form using POST.',
        405
    );
}

$recipientEmail = trim($recipientEmail);
$companyName = safeHeaderValue($companyName);

if (!isValidEmailAddress($recipientEmail) || $companyName === '') {
    respondJson(
        false,
        'Contact form is not configured correctly.',
        500
    );
}

$honeypot = postString('website_check');

if ($honeypot !== '') {
    respondJson(
        true,
        $successMessage,
        200
    );
}

$name = cleanSingleLine(postString('name'));
$company = cleanSingleLine(postString('company'));
$email = cleanSingleLine(postString('email'));
$website = cleanSingleLine(postString('website'));
$businessType = cleanSingleLine(postString('business_type'));
$budget = cleanSingleLine(postString('budget'));
$service = cleanSingleLine(postString('service'));
$message = cleanMessage(postString('message'));

$errors = array();

if ($name === '') {
    $errors['name'] = 'Please enter your name.';
} elseif (textLength($name) < 2 || textLength($name) > 100) {
    $errors['name'] = 'Please enter a valid name.';
}

if ($email === '') {
    $errors['email'] = 'Please enter your business email.';
} elseif (!isValidEmailAddress($email)) {
    $errors['email'] = 'Please enter a valid email address.';
}

if ($company !== '' && textLength($company) > 150) {
    $errors['company'] = 'Company name is too long.';
}

if ($businessType !== '' && textLength($businessType) > 100) {
    $errors['business_type'] = 'Business type is too long.';
}

if ($budget !== '' && textLength($budget) > 100) {
    $errors['budget'] = 'Budget value is too long.';
}

if ($service !== '' && textLength($service) > 150) {
    $errors['service'] = 'Service value is too long.';
}

if ($message !== '' && textLength($message) > 3000) {
    $errors['message'] = 'Your message is too long.';
}

if ($website !== '') {
    if (!preg_match('~^https?://~i', $website)) {
        $website = 'https://' . $website;
    }

    if (filter_var($website, FILTER_VALIDATE_URL) === false || textLength($website) > 250) {
        $errors['website'] = 'Please enter a valid website address.';
    }
}

if (!empty($errors)) {
    respondJson(
        false,
        reset($errors),
        422,
        $errors
    );
}

$subject = safeHeaderValue('New Google Ads audit request - ' . $companyName);

$lines = array(
    'NEW WEBSITE ENQUIRY',
    '==============================',
    '',
    'Name: ' . ($name !== '' ? $name : 'Not provided'),
    'Company: ' . ($company !== '' ? $company : 'Not provided'),
    'Business Email: ' . $email,
    'Website: ' . ($website !== '' ? $website : 'Not provided'),
    'Business Type: ' . ($businessType !== '' ? $businessType : 'Not provided'),
    'Monthly Advertising Budget: ' . ($budget !== '' ? $budget : 'Not provided'),
    'Service Required: ' . ($service !== '' ? $service : 'Not provided'),
    '',
    'Message:',
    $message !== '' ? $message : 'Not provided',
    '',
    '==============================',
    'Submitted: ' . date('Y-m-d H:i:s'),
);

$emailBody = implode(PHP_EOL, $lines);

$fromEmail = 'website@' . safeHost();

if (!isValidEmailAddress($fromEmail)) {
    $fromEmail = $recipientEmail;
}

$headers = array(
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: ' . $companyName . ' <' . $fromEmail . '>',
    'Reply-To: ' . $email,
    'X-Mailer: PHP/' . phpversion(),
);

$sent = @mail(
    $recipientEmail,
    $subject,
    $emailBody,
    implode("\r\n", $headers)
);

if (!$sent) {
    respondJson(
        false,
        'Unable to send your request right now. Please try again later.',
        500
    );
}

respondJson(
    true,
    $successMessage,
    200
);
