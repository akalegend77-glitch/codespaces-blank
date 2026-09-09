const fileInput =
    document.getElementById("fileInput");

const fileName =
    document.getElementById("fileName");

const uploadBox =
    document.getElementById("uploadBox");

const previewContainer =
    document.getElementById("previewContainer");

const preview =
    document.getElementById("preview");

const controls =
    document.getElementById("controls");

const quality =
    document.getElementById("quality");

const qualityValue =
    document.getElementById("qualityValue");

const compressButton =
    document.getElementById("compressButton");

const result =
    document.getElementById("result");

const originalSize =
    document.getElementById("originalSize");

const compressedSize =
    document.getElementById("compressedSize");

const savedPercent =
    document.getElementById("savedPercent");

const status =
    document.getElementById("status");

const downloadButton =
    document.getElementById("downloadButton");
    const downloadList =
    document.getElementById("downloadList");
    
    const individualResults =
    document.getElementById("individualResults");

const resetButton =
    document.getElementById("resetButton");


let selectedFiles = [];

let previewURL = null;

let downloadURL = null;


// ========================================
// FILE SELECTION
// ========================================

fileInput.addEventListener(
    "change",
    function () {

        const files =
            Array.from(fileInput.files);

        if (files.length === 0) {
            return;
        }

        handleFiles(files);
    }
);


// ========================================
// HANDLE FILES
// ========================================

function handleFiles(files) {

    const jpgFiles =
        files.filter(function (file) {
            return file.type === "image/jpeg";
        });


    if (jpgFiles.length === 0) {

        fileName.textContent =
            "Please select JPG images.";

        return;
    }


    selectedFiles =
        jpgFiles;


    if (jpgFiles.length === 1) {

        fileName.textContent =
            `${jpgFiles[0].name} • ${formatSize(jpgFiles[0].size)}`;

    } else {

        fileName.textContent =
            `${jpgFiles.length} JPG images selected`;
    }


    // Clean previous preview URL

    if (previewURL) {

        URL.revokeObjectURL(previewURL);

        previewURL = null;
    }


    // Preview first image

    previewURL =
        URL.createObjectURL(jpgFiles[0]);

    preview.src =
        previewURL;


    // Show controls

    previewContainer.style.display =
        "block";

    controls.style.display =
        "block";

    result.style.display =
        "none";


    // Reset quality

    quality.value = 70;

    qualityValue.textContent =
        "70%";
}


// ========================================
// DRAG & DROP
// ========================================

uploadBox.addEventListener(
    "dragover",
    function (event) {

        event.preventDefault();

        uploadBox.classList.add("drag-over");
    }
);


uploadBox.addEventListener(
    "dragleave",
    function () {

        uploadBox.classList.remove("drag-over");
    }
);


uploadBox.addEventListener(
    "drop",
    function (event) {

        event.preventDefault();

        uploadBox.classList.remove("drag-over");


        const files =
            Array.from(
                event.dataTransfer.files
            );


        if (files.length > 0) {

            handleFiles(files);
        }
    }
);


// ========================================
// QUALITY SLIDER
// ========================================

quality.addEventListener(
    "input",
    function () {

        qualityValue.textContent =
            quality.value + "%";
    }
);


// ========================================
// COMPRESS
// ========================================

compressButton.addEventListener(
    "click",
    async function () {

        if (selectedFiles.length === 0) {
            return;
        }


        compressButton.disabled =
            true;

        compressButton.textContent =
            "Compressing...";


        result.style.display =
            "block";


        status.textContent =
            `Compressing 0 of ${selectedFiles.length} images...`;


        await compressAllImages();


        compressButton.disabled =
            false;

        compressButton.textContent =
            "Compress Images";
    }
);


// ========================================
// COMPRESS ALL IMAGES
// ========================================

async function compressAllImages() {

    const results = [];


    for (
        let i = 0;
        i < selectedFiles.length;
        i++
    ) {

        status.textContent =
            `Compressing ${i + 1} of ${selectedFiles.length} images...`;


        const result =
            await compressImage(
                selectedFiles[i]
            );


        results.push(result);
    }


    showResults(results);
}


// ========================================
// IMAGE COMPRESSION
// ========================================

function compressImage(file) {

    return new Promise(function (resolve) {

        const reader =
            new FileReader();


        reader.onload =
            function (event) {

                const image =
                    new Image();


                image.onload =
                    function () {

                        const MAX_WIDTH = 2400;
                        const MAX_HEIGHT = 2400;


                        let width =
                            image.width;

                        let height =
                            image.height;


                        // Smart Resize

                        if (
                            width > MAX_WIDTH ||
                            height > MAX_HEIGHT
                        ) {

                            const scale =
                                Math.min(
                                    MAX_WIDTH / width,
                                    MAX_HEIGHT / height
                                );


                            width =
                                Math.round(
                                    width * scale
                                );

                            height =
                                Math.round(
                                    height * scale
                                );
                        }


                        const canvas =
                            document.createElement(
                                "canvas"
                            );


                        canvas.width =
                            width;

                        canvas.height =
                            height;


                        const ctx =
                            canvas.getContext(
                                "2d"
                            );


                        ctx.drawImage(
                            image,
                            0,
                            0,
                            width,
                            height
                        );


                        const selectedQuality =
                            Number(
                                quality.value
                            ) / 100;


                        canvas.toBlob(

                            function (blob) {

                                const finalBlob =
    blob && blob.size < file.size
        ? blob
        : file;

resolve({

    file: file,

    blob: finalBlob,

    originalWidth:
        image.width,

    originalHeight:
        image.height,

    finalWidth:
        width,

    finalHeight:
        height

});

                            },

                            "image/jpeg",

                            selectedQuality
                        );
                    };


                image.src =
                    event.target.result;
            };


        reader.readAsDataURL(file);
    });
}


// ========================================
// SHOW RESULTS
// ========================================

function showResults(results) {

    const totalOriginal =
        results.reduce(
            function (total, item) {
                return total + item.file.size;
            },
            0
        );


    const totalCompressed =
        results.reduce(
            function (total, item) {
                return total + item.blob.size;
            },
            0
        );


    const totalSaved =
        totalOriginal > 0
            ? (
                (totalOriginal - totalCompressed) /
                totalOriginal
            ) * 100
            : 0;


    originalSize.textContent =
        formatSize(totalOriginal);


    compressedSize.textContent =
        formatSize(totalCompressed);


    savedPercent.textContent =
    totalSaved >= 0.5
        ? totalSaved.toFixed(1) + "%"
        : "0%";

    status.textContent =
        `${results.length} image${results.length === 1 ? "" : "s"} compressed successfully.`;


    // Clear previous individual results

    individualResults.innerHTML = "";


    // Create individual result cards

    results.forEach(
        function (item, index) {

            const card =
                document.createElement("div");

            card.className =
                "individual-result";

const saved =
    item.blob.size < item.file.size
        ? (
            (item.file.size - item.blob.size) /
            item.file.size
        ) * 100
        : 0;

const displayedSaved =
    saved >= 0.5
        ? saved.toFixed(1)
        : "0";


            card.innerHTML = `
                <strong>${index + 1}. ${item.file.name}</strong>

                <div class="individual-stats">
                    <span>
                        Original: ${formatSize(item.file.size)}
                    </span>

                    <span>
                        Compressed: ${formatSize(item.blob.size)}
                    </span>

                    <span>
                        Saved: ${displayedSaved}%
                    </span>
                </div>
            `;


            individualResults.appendChild(card);
        }
    );


    createDownloadButtons(results);
}


// ========================================
// DOWNLOAD BUTTONS
// ========================================

function createDownloadButtons(results) {

    downloadList.innerHTML = "";

    if (downloadURL) {
        URL.revokeObjectURL(downloadURL);
        downloadURL = null;
    }

    const firstResult = results[0];

    downloadURL =
        URL.createObjectURL(firstResult.blob);

    downloadButton.href = downloadURL;

    downloadButton.download =
        "compressed-" +
        firstResult.file.name;

    downloadButton.textContent =
        results.length === 1
            ? "Download Compressed JPG"
            : "Download First Compressed JPG";

    downloadButton.style.display =
        "inline-block";

    resetButton.style.display =
        "block";



    // Individual download buttons

    if (results.length > 1) {

        results.forEach(
            function (item, index) {

                const link =
                    document.createElement("a");

                link.href = "#";

                link.textContent =
                    `Download ${index + 1}: ${item.file.name}`;

                link.className =
                    "extra-download";


                link.onclick = function (event) {

                    event.preventDefault();

                    downloadBlob(
                        item.blob,
                        "compressed-" + item.file.name
                    );
                };


                downloadList.appendChild(link);
            }
        );
    }
}


// ========================================
// DOWNLOAD BLOB
// ========================================

function downloadBlob(blob, filename) {

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download = filename;

    link.style.display = "none";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    setTimeout(function () {
        URL.revokeObjectURL(url);
    }, 1000);
}

// ========================================
// RESET
// ========================================

resetButton.addEventListener(
    "click",
    function () {

        selectedFiles = [];


        fileInput.value = "";


        previewContainer.style.display =
            "none";

        controls.style.display =
            "none";

        result.style.display =
            "none";


        fileName.textContent =
            "";

        status.textContent =
            "";


        downloadButton.style.display =
            "none";

        resetButton.style.display =
            "none";


        downloadButton.textContent =
            "Download Compressed JPG";


        

        downloadList.innerHTML = "";


        quality.value = 70;

        qualityValue.textContent =
            "70%";


        if (previewURL) {

            URL.revokeObjectURL(
                previewURL
            );

            previewURL = null;
        }


        if (downloadURL) {

            URL.revokeObjectURL(
                downloadURL
            );

            downloadURL = null;
        }


        preview.src = "";
    }
);


// ========================================
// FILE SIZE FORMATTER
// ========================================

function formatSize(bytes) {

    if (bytes < 1024) {

        return bytes + " B";
    }


    if (bytes < 1024 * 1024) {

        return (
            bytes / 1024
        ).toFixed(1) + " KB";
    }


    return (
        bytes / (1024 * 1024)
    ).toFixed(2) + " MB";
}