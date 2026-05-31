<?php
require 'config.php';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM posts ORDER BY created_at DESC");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
    http_response_code(403);
    echo json_encode(['error' => 'Acesso negado']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if ($method === 'POST') {
    $stmt = $pdo->prepare("INSERT INTO posts (title, image_url, description) VALUES (?, ?, ?)");
    $stmt->execute([$data['title'], $data['image_url'] ?? '', $data['description'] ?? '']);
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
} elseif ($method === 'PUT') {
    if (isset($data['action']) && $data['action'] === 'increment_view') {
        $stmt = $pdo->prepare("UPDATE posts SET views = views + 1 WHERE id = ?");
        $stmt->execute([$data['id']]);
        echo json_encode(['success' => true]);
    } else {
        $stmt = $pdo->prepare("UPDATE posts SET title=?, image_url=?, description=? WHERE id=?");
        $stmt->execute([$data['title'], $data['image_url'] ?? '', $data['description'] ?? '', $data['id']]);
        echo json_encode(['success' => true]);
    }
} elseif ($method === 'DELETE') {
    $stmt = $pdo->prepare("DELETE FROM posts WHERE id=?");
    $stmt->execute([$data['id']]);
    echo json_encode(['success' => true]);
}
?>