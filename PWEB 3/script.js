// ========================================
// BAGIAN 1: INISIALISASI & VARIABEL GLOBAL
// ========================================

// Ambil elemen HTML yang ada di dalam DOM (Document Object Model)
const taskInput = document.getElementById("taskInput");      // Input field untuk tugas baru
const taskList = document.getElementById("taskList");        // Kontainer untuk daftar tugas
const addBtn = document.getElementById("addBtn");            // Tombol Add
const taskCount = document.getElementById("taskCount");      // Penampil jumlah tugas
const emptyState = document.getElementById("emptyState");    // Pesan ketika tidak ada tugas

// Audio elements untuk sound effect
const addSound = document.getElementById("addSound");
const completeSound = document.getElementById("completeSound");
const deleteSound = document.getElementById("deleteSound");

// Array untuk menyimpan semua tugas
// JSON.parse() mengubah string JSON menjadi object/array
// || [] artinya jika localStorage kosong, gunakan array kosong []
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// ========================================
// BAGIAN 2: SOUND EFFECT DENGAN WEB AUDIO API
// ========================================

/**
 * Fungsi untuk membuat sound baru menggunakan Web Audio API
 * Web Audio API = teknologi browser untuk membuat/merekam suara
 */
function playSound(context, frequencies, duration, volume) {
    // Ambil waktu saat ini dari audio context
    let time = context.currentTime;
    
    // Loop untuk setiap frekuensi/nada dalam array frequencies
    frequencies.forEach((freq, index) => {
        // Buat oscillator (pembuat gelombang suara)
        const osc = context.createOscillator();
        
        // Buat gain node (pengontrol volume)
        const gain = context.createGain();
        
        // Hubungkan oscillator ke gain, gain ke speaker
        osc.connect(gain);
        gain.connect(context.destination);
        
        // Set frekuensi dan tipe gelombang (sine = halus)
        osc.frequency.value = freq;
        osc.type = 'sine';
        
        // Set volume awal dan fade out (menurun)
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + duration / 1000);
        
        // Jalankan oscillator dengan timing staggered (bertahap)
        osc.start(time + (index * duration / 1000 / frequencies.length));
        osc.stop(time + (index * duration / 1000 / frequencies.length) + duration / 1000);
    });
}

// Fungsi untuk play sound ketika ADD tugas (nada: 800, 1000, 1200 Hz)
function playAddSound() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    playSound(context, [800, 1000, 1200], 150, 0.3);
}

// Fungsi untuk play sound ketika COMPLETE tugas (nada lebih tinggi: 1050, 1320, 1760 Hz)
function playCompleteSound() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    playSound(context, [1050, 1320, 1760], 200, 0.3);
}

// Fungsi untuk play sound ketika DELETE tugas (nada rendah menurun: 400, 300, 200 Hz)
function playDeleteSound() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    playSound(context, [400, 300, 200], 100, 0.2);
}

// ========================================
// BAGIAN 3: EVENT LISTENER (Mendengarkan Interaksi User)
// ========================================

// Jalankan addTask() ketika tombol Add diklik
addBtn.addEventListener("click", addTask);

// Jalankan addTask() ketika user tekan tombol ENTER di input field
taskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addTask();  // e.key adalah tombol apa yang ditekan
});

// ========================================
// BAGIAN 4: FUNCTION UTAMA CRUD (Create, Read, Update, Delete)
// ========================================

/**
 * FUNCTION: addTask()
 * Menambahkan tugas baru ke dalam array tasks
 */
function addTask() {
    // .trim() menghilangkan spasi di awal & akhir
    const taskText = taskInput.value.trim();
    
    // Jika input kosong, fokus ke input field dan keluar function
    if (taskText === "") {
        taskInput.focus();
        return;
    }

    // Play sound effect untuk feedback kepada user
    playAddSound();

    // Buat object untuk tugas baru
    const task = {
        id: Date.now(),                                    // ID unik berdasarkan timestamp
        text: taskText,                                    // Teks tugas dari input
        completed: false,                                  // Status awalnya belum selesai
        createdAt: new Date().toLocaleDateString('id-ID') // Tanggal pembuatan
    };
    
    // Tambahkan tugas baru ke array tasks
    tasks.push(task);
    
    // Simpan ke localStorage agar data bertahan meski browser ditutup
    saveTasks();
    
    // Kosongkan input field
    taskInput.value = "";
    
    // Fokus ke input field agar user bisa langsung mengetik tugas berikutnya
    taskInput.focus();
    
    // Update tampilan daftar tugas
    displayTasks();
}

/**
 * FUNCTION: deleteTask(id)
 * Menghapus tugas dengan ID tertentu
 */
function deleteTask(id) {
    // Play sound effect untuk feedback
    playDeleteSound();
    
    // .filter() mengembalikan array baru tanpa item yang dihapus
    // task.id !== id = ambil semua tugas KECUALI yang ID-nya cocok
    tasks = tasks.filter(task => task.id !== id);
    
    // Simpan perubahan ke localStorage
    saveTasks();
    
    // Update tampilan
    displayTasks();
    
    // Tampilkan notifikasi
    showNotification("Tugas berhasil dihapus!", "danger");
}

/**
 * FUNCTION: toggleTask(id)
 * Toggle status tugas (selesai/belum selesai)
 * ! = NOT operator (membalikkan nilai boolean)
 */
function toggleTask(id) {
    // .find() mencari element pertama yang cocok dengan kondisi
    const task = tasks.find(t => t.id === id);
    
    // Jika tugas ditemukan
    if (task) {
        // Balikkan status completed (true jadi false, false jadi true)
        task.completed = !task.completed;
        
        // Play sound effect untuk feedback
        playCompleteSound();
        
        // Simpan perubahan
        saveTasks();
        
        // Update tampilan
        displayTasks();
    }
}

/**
 * FUNCTION: editTask(id)
 * Mengubah teks tugas yang sudah ada
 */
function editTask(id) {
    // Cari tugas dengan ID yang cocok
    const task = tasks.find(t => t.id === id);
    
    if (task) {
        // prompt() menampilkan dialog box untuk user input
        const newtext = prompt("Edit tugas:", task.text);
        
        // Jika user tidak klik Cancel (newtext !== null) & input tidak kosong
        if (newtext !== null && newtext.trim() !== "") {
            // Play sound effect
            playAddSound();
            
            // Update teks tugas
            task.text = newtext.trim();
            
            // Simpan perubahan
            saveTasks();
            
            // Update tampilan
            displayTasks();
        }
    }
}

// ========================================
// BAGIAN 5: STORAGE FUNCTIONS (Simpan & Tampilkan Data)
// ========================================

/**
 * FUNCTION: saveTasks()
 * Menyimpan array tasks ke localStorage sebagai string JSON
 * JSON.stringify() mengubah object/array menjadi string JSON
 */
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

/**
 * FUNCTION: displayTasks()
 * Menampilkan semua tugas di halaman HTML
 */
function displayTasks() {
    // Kosongkan list terlebih dahulu
    taskList.innerHTML = "";
    
    // Jika tidak ada tugas
    if (tasks.length === 0) {
        // Tampilkan pesan "Belum ada tugas"
        emptyState.style.display = "block";
        taskCount.textContent = "0";
        return;  // Keluar dari function
    }
    
    // Sembunyikan pesan kosong
    emptyState.style.display = "none";
    
    // Update jumlah tugas yang ditampilkan
    taskCount.textContent = tasks.length;

    // Loop untuk setiap tugas dalam array
    tasks.forEach((task) => {
        // Buat element <li> baru
        const li = document.createElement("li");
        li.className = "list-group-item task-item py-3";
        
        // Jika tugas sudah selesai, tambahkan styling strikethrough (coret)
        const taskClass = task.completed ? "text-decoration-line-through text-muted" : "";
        
        // Masukkan HTML ke dalam <li>
        // Template literal (backtick `) memungkinkan menyisipkan variabel dengan ${}
        li.innerHTML = `
            <div class="d-flex align-items-center gap-3">
                <!-- Checkbox untuk toggle completed -->
                <input type="checkbox" class="form-check-input" ${task.completed ? "checked" : ""} 
                       onchange="toggleTask(${task.id})">
                
                <!-- Konten tugas -->
                <div class="flex-grow-1">
                    <p class="${taskClass} mb-1">${escapeHtml(task.text)}</p>
                    <small class="text-muted">${task.createdAt}</small>
                </div>
                
                <!-- Tombol Edit dan Delete -->
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-warning" onclick="editTask(${task.id})" title="Edit tugas">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger" onclick="deleteTask(${task.id})" title="Hapus tugas">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Tambahkan <li> ke dalam <ul id="taskList">
        taskList.appendChild(li);
    });
}

// ========================================
// BAGIAN 6: UTILITY FUNCTIONS (Fungsi Pembantu)
// ========================================

/**
 * FUNCTION: escapeHtml(text)
 * Mengubah karakter spesial menjadi entity HTML
 * Ini untuk keamanan (prevent XSS attack)
 * Contoh: < menjadi &lt; , > menjadi &gt;
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;  // Aman dari HTML injection
    return div.innerHTML;
}

/**
 * FUNCTION: showNotification(message, type)
 * Menampilkan notifikasi toast di sudut kanan bawah
 * type = "success" atau "danger"
 */
function showNotification(message, type = "success") {
    // Ambil element toast
    const toast = document.getElementById("notificationToast");
    const toastBody = document.getElementById("notificationMessage");
    
    // Masukkan pesan ke dalam toast
    toastBody.textContent = message;
    
    // Tambahkan class untuk styling dan tampilkan
    toast.className = `toast show position-fixed bottom-0 end-0 m-3 bg-${type}`;
    
    // Sembunyikan notifikasi setelah 3 detik (3000 ms)
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// ========================================
// BAGIAN 7: LOAD AWAL (Jalankan ketika halaman dimuat)
// ========================================

// Tampilkan semua tugas yang sudah tersimpan di localStorage
displayTasks();