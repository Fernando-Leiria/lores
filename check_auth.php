<?php
session_start();
echo json_encode([
    'logged_in' => isset($_SESSION['user_id']),
    'is_admin' => $_SESSION['is_admin'] ?? false,
    'username' => $_SESSION['username'] ?? null
]);
?>