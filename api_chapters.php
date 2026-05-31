<?php
require 'config.php';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $post_id = $_GET['post_id'] ?? 0;
    $stmt = $pdo->prepare("SELECT * FROM chapters WHERE post_id = ? ORDER BY created_at");
    $stmt->execute([$post_id]);
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
    $stmt = $pdo->prepare("INSERT INTO chapters (post_id, title, tags, image_url, summary, content_html) VALUES (?,?,?,?,?,?)");
    $stmt->execute([$data['post_id'], $data['title'], $data['tags'], $data['image_url'], $data['summary'], $data['content_html']]);
    echo json_encode(['success' => true]);
} elseif ($method === 'PUT') {
    $stmt = $pdo->prepare("UPDATE chapters SET title=?, tags=?, image_url=?, summary=?, content_html=? WHERE id=?");
    $stmt->execute([$data['title'], $data['tags'], $data['image_url'], $data['summary'], $data['content_html'], $data['id']]);
    echo json_encode(['success' => true]);
} elseif ($method === 'DELETE') {
    $stmt = $pdo->prepare("DELETE FROM chapters WHERE id=?");
    $stmt->execute([$data['id']]);
    echo json_encode(['success' => true]);
}
?>