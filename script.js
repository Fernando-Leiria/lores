// ==================== ESTRUTURA DE DADOS ====================
let posts = [];        // cada post: { id, titulo, imagem, descricao, visualizacoes, capitulos[] }
let currentPostId = null;   // qual postagem está aberta no detalhe

// IDs simulados
let nextPostId = 1;
let nextChapterId = 1;

// Variáveis de UI
let editingPostId = null;
let editingChapterId = null;
let currentChapterImageBase64 = null;
let currentPostImageBase64 = null;

// ==================== INICIALIZAÇÃO ====================
function loadFromStorage() {
    const stored = localStorage.getItem("forum_mysrissia");
    if (stored) {
        try {
            posts = JSON.parse(stored);
            // garantir estrutura mínima
            posts.forEach(p => {
                if (!p.capitulos) p.capitulos = [];
                if (p.visualizacoes === undefined) p.visualizacoes = 0;
                p.capitulos.forEach(c => {
                    if (c.tags === undefined) c.tags = [];
                    if (!c.contentHtml) c.contentHtml = "<p></p>";
                    if (!c.summary) c.summary = "";
                });
            });
            // atualizar contadores de ids
            const maxPostId = posts.reduce((max, p) => Math.max(max, p.id), 0);
            nextPostId = maxPostId + 1;
            let maxChap = 0;
            posts.forEach(p => p.capitulos.forEach(c => maxChap = Math.max(maxChap, c.id)));
            nextChapterId = maxChap + 1;
        } catch(e) { posts = []; }
    } else {
        posts = [];
    }
    renderPostsView();
}
function saveToStorage() {
    localStorage.setItem("forum_mysrissia", JSON.stringify(posts));
}

// ==================== POSTAGENS ====================
function addPost(titulo, imagem, descricao) {
    if (!titulo.trim()) titulo = "Sem título";
    const newPost = {
        id: nextPostId++,
        titulo: titulo.trim(),
        imagem: imagem || "",
        descricao: descricao || "",
        visualizacoes: 0,
        capitulos: []
    };
    posts.push(newPost);
    saveToStorage();
    renderPostsView();
}
function updatePost(id, titulo, imagem, descricao) {
    const idx = posts.findIndex(p => p.id === id);
    if (idx !== -1) {
        posts[idx].titulo = titulo.trim();
        posts[idx].imagem = imagem || "";
        posts[idx].descricao = descricao || "";
        saveToStorage();
        if (currentPostId === id) renderPostDetailView(id);
        else renderPostsView();
    }
}
function deletePost(id) {
    if (!confirm("Excluir esta postagem e todos os seus capítulos?")) return;
    posts = posts.filter(p => p.id !== id);
    if (currentPostId === id) {
        currentPostId = null;
        document.getElementById("postDetailView").style.display = "none";
        document.getElementById("postsView").style.display = "block";
    }
    saveToStorage();
    renderPostsView();
}
function incrementViews(postId) {
    const p = posts.find(p => p.id === postId);
    if (p) {
        p.visualizacoes = (p.visualizacoes || 0) + 1;
        saveToStorage();
        if (currentPostId === postId) renderPostDetailHeader(p);
        renderPostsView(); // atualiza contagem na lista
    }
}

// ==================== CAPÍTULOS ====================
function addChapter(postId, titulo, tagsArray, imagem, resumo, conteudoHtml) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const newChap = {
        id: nextChapterId++,
        titulo: titulo.trim() || "Capítulo",
        tags: tagsArray,
        imagem: imagem || "",
        summary: resumo || "",
        contentHtml: conteudoHtml || "<p></p>",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    post.capitulos.push(newChap);
    saveToStorage();
    if (currentPostId === postId) renderPostDetailView(postId);
}
function updateChapter(postId, chapterId, titulo, tagsArray, imagem, resumo, conteudoHtml) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const idx = post.capitulos.findIndex(c => c.id === chapterId);
    if (idx !== -1) {
        post.capitulos[idx] = {
            ...post.capitulos[idx],
            titulo: titulo.trim(),
            tags: tagsArray,
            imagem: imagem || "",
            summary: resumo,
            contentHtml: conteudoHtml,
            updatedAt: new Date().toISOString()
        };
        saveToStorage();
        if (currentPostId === postId) renderPostDetailView(postId);
    }
}
function deleteChapter(postId, chapterId) {
    if (!confirm("Excluir capítulo?")) return;
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.capitulos = post.capitulos.filter(c => c.id !== chapterId);
        saveToStorage();
        if (currentPostId === postId) renderPostDetailView(postId);
    }
}

// ==================== RENDERIZAÇÃO ====================
function renderPostsView() {
    document.getElementById("postsView").style.display = "block";
    document.getElementById("postDetailView").style.display = "none";
    const grid = document.getElementById("postsGrid");
    const totalPostsSpan = document.getElementById("totalPosts");
    const totalViewsSpan = document.getElementById("totalViews");
    totalPostsSpan.innerText = posts.length;
    const totalViews = posts.reduce((acc, p) => acc + (p.visualizacoes || 0), 0);
    totalViewsSpan.innerText = totalViews;

    if (!posts.length) {
        grid.innerHTML = `<div class="empty-message">Nenhuma postagem ainda. Clique em "Nova Postagem".</div>`;
        return;
    }
    grid.innerHTML = "";
    posts.forEach(p => {
        const card = document.createElement("div");
        card.className = "post-card";
        card.innerHTML = `
            <img class="post-img" src="${p.imagem || 'https://placehold.co/300x160?text=Sem+Imagem'}" onerror="this.src='https://placehold.co/300x160?text=Erro'">
            <h3 class="post-title">${escapeHtml(p.titulo)}</h3>
            <div class="post-desc">${escapeHtml(p.descricao.substring(0, 100))}${p.descricao.length > 100 ? '…' : ''}</div>
            <div class="post-meta"><span><i class="fas fa-eye"></i> ${p.visualizacoes || 0} visualizações</span><span><i class="fas fa-book"></i> ${p.capitulos.length} capítulos</span></div>
            <div class="post-actions">
                <button class="viewPostBtn" data-id="${p.id}"><i class="fas fa-folder-open"></i> Abrir</button>
                <button class="editPostBtn" data-id="${p.id}"><i class="fas fa-edit"></i> Editar</button>
                <button class="deletePostBtn" data-id="${p.id}"><i class="fas fa-trash-alt"></i> Excluir</button>
            </div>
        `;
        grid.appendChild(card);
    });
    document.querySelectorAll(".viewPostBtn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(btn.dataset.id);
            currentPostId = id;
            incrementViews(id);
            renderPostDetailView(id);
        });
    });
    document.querySelectorAll(".editPostBtn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(btn.dataset.id);
            openPostModalForEdit(id);
        });
    });
    document.querySelectorAll(".deletePostBtn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(btn.dataset.id);
            deletePost(id);
        });
    });
}

function renderPostDetailHeader(post) {
    const container = document.getElementById("postDetailHeader");
    container.innerHTML = `
        <div style="display:flex; gap:1.5rem; align-items:center; flex-wrap:wrap; margin-bottom:1rem;">
            <img src="${post.imagem || 'https://placehold.co/160x160?text=Imagem'}" style="width:120px; height:120px; object-fit:cover; border-radius:32px; border:2px solid #c0678b;">
            <div>
                <h2 style="font-family:'Cinzel';">📖 ${escapeHtml(post.titulo)}</h2>
                <p style="font-style:italic;">${escapeHtml(post.descricao) || "Sem descrição."}</p>
                <p><i class="fas fa-eye"></i> ${post.visualizacoes || 0} visualizações · ${post.capitulos.length} capítulos</p>
            </div>
        </div>
    `;
}
function renderPostDetailView(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    document.getElementById("postsView").style.display = "none";
    document.getElementById("postDetailView").style.display = "block";
    renderPostDetailHeader(post);
    const container = document.getElementById("chaptersContainer");
    if (!post.capitulos.length) {
        container.innerHTML = `<div class="empty-message">Nenhum capítulo. Clique em "Novo Capítulo".</div>`;
        return;
    }
    let html = "";
    post.capitulos.forEach(ch => {
        const tagsHtml = (ch.tags && ch.tags.length) ? `<div class="chapter-tags">${ch.tags.map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join('')}</div>` : '';
        html += `
            <div class="chapter-card" id="chapter-${ch.id}">
                <div class="chapter-header">
                    <h3 style="font-family:'Cinzel';">❖ ${escapeHtml(ch.titulo)}</h3>
                    <small>${formatDateTime(ch.createdAt)}</small>
                </div>
                ${tagsHtml}
                <div class="chapter-preview">
                    <img class="chapter-img" src="${ch.imagem || 'https://placehold.co/140x140?text=Sem+Imagem'}" onerror="this.src='https://placehold.co/140x140?text=Erro'">
                    <div class="chapter-summary">${escapeHtml(ch.summary) || "Sem resumo."}</div>
                </div>
                <button class="btn-expand" data-chid="${ch.id}"><i class="fas fa-chevron-down"></i> Ler mais</button>
                <div id="fullChapter-${ch.id}" class="chapter-full-content">${sanitizeHtml(ch.contentHtml)}</div>
                <div class="chapter-actions">
                    <button class="editChapterBtn" data-chid="${ch.id}"><i class="fas fa-pen"></i> Editar</button>
                    <button class="deleteChapterBtn" data-chid="${ch.id}"><i class="fas fa-trash-alt"></i> Excluir</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    // Expandir/recolher
    document.querySelectorAll(".btn-expand").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const chid = parseInt(btn.dataset.chid);
            const fullDiv = document.getElementById(`fullChapter-${chid}`);
            if (fullDiv.style.display === "none" || !fullDiv.style.display) {
                fullDiv.style.display = "block";
                btn.innerHTML = '<i class="fas fa-chevron-up"></i> Esconder';
            } else {
                fullDiv.style.display = "none";
                btn.innerHTML = '<i class="fas fa-chevron-down"></i> Ler mais';
            }
        });
    });
    document.querySelectorAll(".editChapterBtn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const chid = parseInt(btn.dataset.chid);
            openChapterModalForEdit(postId, chid);
        });
    });
    document.querySelectorAll(".deleteChapterBtn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const chid = parseInt(btn.dataset.chid);
            deleteChapter(postId, chid);
        });
    });
    post.capitulos.forEach(ch => {
        const fc = document.getElementById(`fullChapter-${ch.id}`);
        if (fc) fc.style.display = "none";
    });
}

// ==================== MODAL POSTAGEM ====================
function openPostModalForEdit(id = null) {
    editingPostId = id;
    const modal = document.getElementById("postModal");
    const titleEl = document.getElementById("postModalTitle");
    if (id !== null) {
        const post = posts.find(p => p.id === id);
        if (!post) return;
        titleEl.innerText = "✎ Editar Postagem";
        document.getElementById("postTitle").value = post.titulo;
        setPostImagePreview(post.imagem);
        document.getElementById("postDesc").value = post.descricao;
    } else {
        titleEl.innerText = "✧ Nova Postagem ✧";
        document.getElementById("postTitle").value = "";
        resetPostImage();
        document.getElementById("postDesc").value = "";
    }
    modal.classList.add("active");
}
function setPostImagePreview(imgData) {
    if (imgData && imgData.trim()) {
        currentPostImageBase64 = imgData;
        const container = document.getElementById("postPreviewContainer");
        const img = document.getElementById("postPreviewImg");
        img.src = imgData;
        container.style.display = "flex";
        document.getElementById("postImageUrl").value = (imgData.startsWith("http") ? imgData : "");
    } else resetPostImage();
}
function resetPostImage() {
    currentPostImageBase64 = null;
    document.getElementById("postPreviewContainer").style.display = "none";
    document.getElementById("postPreviewImg").src = "";
    document.getElementById("postImageUrl").value = "";
}
function setupPostUpload() {
    const area = document.getElementById("postUploadArea");
    const fileInput = document.getElementById("postFileInput");
    area.addEventListener("click", () => fileInput.click());
    area.addEventListener("dragover", e => e.preventDefault());
    area.addEventListener("drop", e => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && (file.type === "image/png" || file.type === "image/jpeg")) processPostFile(file);
        else alert("PNG/JPEG apenas");
    });
    fileInput.addEventListener("change", () => {
        if (fileInput.files.length) processPostFile(fileInput.files[0]);
    });
    document.getElementById("clearPostImgBtn").addEventListener("click", () => resetPostImage());
    document.getElementById("postImageUrl").addEventListener("input", (e) => {
        if (e.target.value.trim()) {
            currentPostImageBase64 = e.target.value.trim();
            document.getElementById("postPreviewImg").src = e.target.value;
            document.getElementById("postPreviewContainer").style.display = "flex";
        } else if (!currentPostImageBase64) resetPostImage();
    });
    function processPostFile(file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            currentPostImageBase64 = ev.target.result;
            document.getElementById("postPreviewImg").src = currentPostImageBase64;
            document.getElementById("postPreviewContainer").style.display = "flex";
            document.getElementById("postImageUrl").value = "";
        };
        reader.readAsDataURL(file);
    }
}
function savePostFromModal() {
    const titulo = document.getElementById("postTitle").value;
    const imagem = currentPostImageBase64 || document.getElementById("postImageUrl").value.trim() || "";
    const descricao = document.getElementById("postDesc").value;
    if (!titulo.trim()) { alert("Título obrigatório"); return; }
    if (editingPostId !== null) {
        updatePost(editingPostId, titulo, imagem, descricao);
    } else {
        addPost(titulo, imagem, descricao);
    }
    closeModal("postModal");
}
// ==================== MODAL CAPÍTULO ====================
let chapterEditor = document.getElementById("chapterEditor");
function setupChapterEditor() {
    document.getElementById("chBold").addEventListener("click", () => execCmd("bold"));
    document.getElementById("chItalic").addEventListener("click", () => execCmd("italic"));
    document.getElementById("chUnderline").addEventListener("click", () => execCmd("underline"));
    document.getElementById("chH3").addEventListener("click", () => execCmd("formatBlock", "h3"));
    document.getElementById("chP").addEventListener("click", () => execCmd("formatBlock", "p"));
    document.getElementById("chClear").addEventListener("click", () => execCmd("removeFormat"));
    document.getElementById("chMarkdown").addEventListener("click", () => {
        chapterEditor.innerHTML = convertMarkdown(chapterEditor.innerHTML);
        chapterEditor.focus();
    });
    chapterEditor.addEventListener("keydown", (e) => {
        if (e.ctrlKey) {
            if (e.key === "b") { e.preventDefault(); execCmd("bold"); }
            else if (e.key === "i") { e.preventDefault(); execCmd("italic"); }
            else if (e.key === "u") { e.preventDefault(); execCmd("underline"); }
        }
    });
}
function execCmd(cmd, val=null) { document.execCommand(cmd, false, val); chapterEditor.focus(); }
function convertMarkdown(html) {
    let div = document.createElement("div"); div.innerHTML = html;
    function process(node) {
        if (node.nodeType === 3) {
            let text = node.textContent;
            if (text.includes("**") || text.includes("*") || text.includes("~~")) {
                text = text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>").replace(/\*(.*?)\*/g, "<i>$1</i>").replace(/~~(.*?)~~/g, "<u>$1</u>");
                let span = document.createElement("span"); span.innerHTML = text; node.parentNode.replaceChild(span, node);
            }
        } else if (node.nodeType === 1 && !["B","I","U","H3"].includes(node.tagName)) node.childNodes.forEach(process);
    }
    div.childNodes.forEach(process);
    return div.innerHTML;
}
function openChapterModalForEdit(postId, chapterId = null) {
    editingChapterId = chapterId;
    const modal = document.getElementById("chapterModal");
    document.getElementById("chapterModalTitle").innerText = chapterId ? "✎ Editar Capítulo" : "✧ Novo Capítulo";
    if (chapterId !== null) {
        const post = posts.find(p => p.id === postId);
        const chap = post?.capitulos.find(c => c.id === chapterId);
        if (chap) {
            document.getElementById("chapterTitle").value = chap.titulo;
            document.getElementById("chapterTags").value = (chap.tags || []).join(", ");
            setChapterImagePreview(chap.imagem);
            document.getElementById("chapterSummary").value = chap.summary || "";
            chapterEditor.innerHTML = chap.contentHtml || "<p></p>";
        }
    } else {
        document.getElementById("chapterTitle").value = "";
        document.getElementById("chapterTags").value = "";
        resetChapterImage();
        document.getElementById("chapterSummary").value = "";
        chapterEditor.innerHTML = "<p></p>";
    }
    modal.classList.add("active");
    window.currentChapterPostId = postId;
}
function setChapterImagePreview(imgData) {
    if (imgData && imgData.trim()) {
        currentChapterImageBase64 = imgData;
        document.getElementById("chapterPreviewImg").src = imgData;
        document.getElementById("chapterPreviewContainer").style.display = "flex";
        document.getElementById("chapterImageUrl").value = (imgData.startsWith("http") ? imgData : "");
    } else resetChapterImage();
}
function resetChapterImage() {
    currentChapterImageBase64 = null;
    document.getElementById("chapterPreviewContainer").style.display = "none";
    document.getElementById("chapterPreviewImg").src = "";
    document.getElementById("chapterImageUrl").value = "";
}
function setupChapterUpload() {
    const area = document.getElementById("chapterUploadArea");
    const fileInput = document.getElementById("chapterFileInput");
    area.addEventListener("click", () => fileInput.click());
    area.addEventListener("dragover", e => e.preventDefault());
    area.addEventListener("drop", e => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && (file.type === "image/png" || file.type === "image/jpeg")) processChapterFile(file);
        else alert("PNG/JPEG");
    });
    fileInput.addEventListener("change", () => { if (fileInput.files.length) processChapterFile(fileInput.files[0]); });
    document.getElementById("clearChapterImgBtn").addEventListener("click", () => resetChapterImage());
    document.getElementById("chapterImageUrl").addEventListener("input", (e) => {
        if (e.target.value.trim()) {
            currentChapterImageBase64 = e.target.value.trim();
            document.getElementById("chapterPreviewImg").src = e.target.value;
            document.getElementById("chapterPreviewContainer").style.display = "flex";
        } else if (!currentChapterImageBase64) resetChapterImage();
    });
    function processChapterFile(file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            currentChapterImageBase64 = ev.target.result;
            document.getElementById("chapterPreviewImg").src = currentChapterImageBase64;
            document.getElementById("chapterPreviewContainer").style.display = "flex";
            document.getElementById("chapterImageUrl").value = "";
        };
        reader.readAsDataURL(file);
    }
}
function saveChapterFromModal() {
    const postId = window.currentChapterPostId;
    if (!postId) return;
    const titulo = document.getElementById("chapterTitle").value;
    const tagsRaw = document.getElementById("chapterTags").value;
    const tagsArray = tagsRaw.split(",").map(t => t.trim().toLowerCase()).filter(t => t);
    const imagem = currentChapterImageBase64 || document.getElementById("chapterImageUrl").value.trim() || "";
    const resumo = document.getElementById("chapterSummary").value;
    let conteudo = chapterEditor.innerHTML;
    if (!conteudo.trim() || conteudo === "<p><br></p>") conteudo = "<p><em>Vazio</em></p>";
    conteudo = convertMarkdown(conteudo);
    conteudo = sanitizeHtml(conteudo);
    if (!titulo.trim()) { alert("Título do capítulo obrigatório"); return; }
    if (editingChapterId !== null) {
        updateChapter(postId, editingChapterId, titulo, tagsArray, imagem, resumo, conteudo);
    } else {
        addChapter(postId, titulo, tagsArray, imagem, resumo, conteudo);
    }
    closeModal("chapterModal");
}

// ==================== UTILITÁRIOS ====================
function escapeHtml(str) { return str?.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])) || ''; }
function sanitizeHtml(html) { let div = document.createElement("div"); div.innerHTML = html; div.querySelectorAll("script, [onclick]").forEach(el => el.remove()); return div.innerHTML; }
function formatDateTime(iso) { return new Date(iso).toLocaleString("pt-BR"); }
function closeModal(id) { document.getElementById(id).classList.remove("active"); }

// ==================== EXPORTAR / IMPORTAR ====================
function exportAll() {
    const dataStr = JSON.stringify(posts, null, 2);
    const blob = new Blob([dataStr], {type: "application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `forum_mysrissia_${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(a.href);
}
function importAll(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                posts = imported;
                // atualizar contadores
                let maxPost = 0, maxChap = 0;
                posts.forEach(p => { maxPost = Math.max(maxPost, p.id); p.capitulos.forEach(c => maxChap = Math.max(maxChap, c.id)); });
                nextPostId = maxPost + 1;
                nextChapterId = maxChap + 1;
                saveToStorage();
                renderPostsView();
                alert("Backup importado com sucesso!");
            } else alert("Arquivo inválido");
        } catch(err) { alert("Erro ao importar"); }
    };
    reader.readAsText(file);
}

// ==================== EVENTOS GLOBAIS ====================
document.addEventListener("DOMContentLoaded", () => {
    loadFromStorage();
    setupPostUpload();
    setupChapterUpload();
    setupChapterEditor();
    document.getElementById("newPostBtn").addEventListener("click", () => openPostModalForEdit());
    document.getElementById("savePostBtn").addEventListener("click", savePostFromModal);
    document.getElementById("saveChapterBtn").addEventListener("click", saveChapterFromModal);
    document.getElementById("backToPostsBtn").addEventListener("click", () => {
        currentPostId = null;
        document.getElementById("postDetailView").style.display = "none";
        document.getElementById("postsView").style.display = "block";
        renderPostsView();
    });
    document.getElementById("addChapterBtn").addEventListener("click", () => {
        if (currentPostId) openChapterModalForEdit(currentPostId);
    });
    document.getElementById("editPostBtn").addEventListener("click", () => {
        if (currentPostId) openPostModalForEdit(currentPostId);
    });
    document.getElementById("deletePostBtn").addEventListener("click", () => {
        if (currentPostId && confirm("Excluir toda a postagem?")) deletePost(currentPostId);
    });
    document.getElementById("exportAllBtn").addEventListener("click", exportAll);
    document.getElementById("importAllBtn").addEventListener("click", () => document.getElementById("importInput").click());
    document.getElementById("importInput").addEventListener("change", (e) => {
        if (e.target.files.length) importAll(e.target.files[0]);
        e.target.value = "";
    });
    document.querySelectorAll(".modalClose").forEach(btn => {
        btn.addEventListener("click", () => {
            closeModal("postModal");
            closeModal("chapterModal");
        });
    });
});