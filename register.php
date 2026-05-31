<?php
require 'config.php';
$data = json_decode(file_get_contents('php://input'), true);
$username = trim($data['username'] ?? '');
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

$errors = [];
if (strlen($password) < 8) $errors[] = 'A senha deve ter pelo menos 8 caracteres.';
if (!preg_match('/[A-Z]/', $password)) $errors[] = 'A senha deve ter pelo menos 1 letra maiúscula.';
if (!preg_match('/[a-z]/', $password)) $errors[] = 'A senha deve ter pelo menos 1 letra minúscula.';
if (!preg_match('/[0-9]/', $password)) $errors[] = 'A senha deve ter pelo menos 1 número.';

if ($errors) {
    http_response_code(400);
    echo json_encode(['error' => implode(' | ', $errors)]);
    exit;
}

$stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
$stmt->execute([$username, $email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['error' => 'Usuário ou email já cadastrado.']);
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)");
$stmt->execute([$username, $email, $hash]);
echo json_encode(['success' => true]);
?>