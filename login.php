<?php
require 'config.php';
$data = json_decode(file_get_contents('php://input'), true);
$login = trim($data['login'] ?? '');
$password = $data['password'] ?? '';

$stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
$stmt->execute([$login, $login]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Credenciais inválidas']);
    exit;
}

$_SESSION['user_id'] = $user['id'];
$_SESSION['username'] = $user['username'];
$_SESSION['is_admin'] = (bool)$user['is_admin'];
echo json_encode(['success' => true, 'is_admin' => $_SESSION['is_admin']]);
?>