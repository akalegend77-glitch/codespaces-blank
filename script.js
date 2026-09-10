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
// BATCH RESULT STATE
// ========================================

let compressedResults = [];

let currentPage = 1;

const RESULTS_PER_PAGE = 5;

let batchDownloadURLs = [];


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


    // Clear old batch results

    clearBatchResults();
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


        const compressed =
            await compressImage(
                selectedFiles[i]
            );


        results.push(compressed);
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

                                // If compression makes the
                                // file larger, keep original.

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

    compressedResults =
        results;

    currentPage =
        1;


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


    // Clear old results

    individualResults.innerHTML = "";

    downloadList.innerHTML = "";


    // Single image:
    // No individual result box needed.

    if (results.length === 1) {

        hideBatchUI();

    } else {

        // Multiple images:
        // Show compact paginated result panel.

        createBatchUI();

        renderBatchPage();
    }


    createDownloadButtons(results);
}


// ========================================
// CREATE BATCH UI
// ========================================

function createBatchUI() {

    hideBatchUI();


    const header =
        document.createElement("div");

    header.id =
        "batchHeader";

    header.className =
        "batch-header";


    const title =
        document.createElement("strong");

    title.textContent =
        "Compression Details";


    const pageInfo =
        document.createElement("span");

    pageInfo.id =
        "batchPageInfo";


    header.appendChild(title);

    header.appendChild(pageInfo);


    individualResults.appendChild(
        header
    );


    const navigation =
        document.createElement("div");

    navigation.id =
        "batchNavigation";

    navigation.className =
        "batch-navigation";


    const previousButton =
        document.createElement("button");

    previousButton.id =
        "prevPage";

    previousButton.type =
        "button";

    previousButton.textContent =
        "‹ Previous";


    const nextButton =
        document.createElement("button");

    nextButton.id =
        "nextPage";

    nextButton.type =
        "button";

    nextButton.textContent =
        "Next ›";


    previousButton.addEventListener(
        "click",
        function () {

            if (currentPage > 1) {

                currentPage--;

                renderBatchPage();
            }
        }
    );


    nextButton.addEventListener(
        "click",
        function () {

            const totalPages =
                Math.ceil(
                    compressedResults.length /
                    RESULTS_PER_PAGE
                );


            if (currentPage < totalPages) {

                currentPage++;

                renderBatchPage();
            }
        }
    );


    navigation.appendChild(
        previousButton
    );

    navigation.appendChild(
        nextButton
    );


    individualResults.appendChild(
        navigation
    );


}


// ========================================
// RENDER BATCH PAGE
// ========================================

function renderBatchPage() {

    if (
        compressedResults.length <= 1
    ) {
        return;
    }


    const header =
        document.getElementById(
            "batchHeader"
        );


    const navigation =
        document.getElementById(
            "batchNavigation"
        );


    const pageInfo =
        document.getElementById(
            "batchPageInfo"
        );


    if (
        !header ||
        !navigation ||
        !pageInfo
    ) {
        return;
    }


    // Remove old cards only.
    // Keep header, navigation and download button.

    const oldCards =
        individualResults.querySelectorAll(
            ".individual-result"
        );


    oldCards.forEach(
        function (card) {
            card.remove();
        }
    );


    const startIndex =
        (
            currentPage - 1
        ) * RESULTS_PER_PAGE;


    const endIndex =
        Math.min(
            startIndex + RESULTS_PER_PAGE,
            compressedResults.length
        );


    const visibleResults =
        compressedResults.slice(
            startIndex,
            endIndex
        );


    visibleResults.forEach(
        function (item, visibleIndex) {

            const actualIndex =
                startIndex + visibleIndex;


            const card =
                document.createElement("div");

            card.className =
                "individual-result";


            const title =
                document.createElement("strong");

            title.textContent =
                `${actualIndex + 1}. ${item.file.name}`;


            const stats =
                document.createElement("div");

            stats.className =
                "individual-stats";


            const original =
                document.createElement("span");

            original.textContent =
                `Original: ${formatSize(item.file.size)}`;


            const compressed =
                document.createElement("span");

            compressed.textContent =
                `Compressed: ${formatSize(item.blob.size)}`;


            const saved =
                item.blob.size < item.file.size
                    ? (
                        (
                            item.file.size -
                            item.blob.size
                        ) /
                        item.file.size
                    ) * 100
                    : 0;


            const displayedSaved =
                saved >= 0.5
                    ? saved.toFixed(1)
                    : "0";


            const savedText =
                document.createElement("span");

            savedText.textContent =
                `Saved: ${displayedSaved}%`;


            stats.appendChild(
                original
            );

            stats.appendChild(
                compressed
            );

            stats.appendChild(
                savedText
            );


            const downloadLink =
                document.createElement("a");

            downloadLink.href =
                "#";

            downloadLink.textContent =
                "Download JPG";

            downloadLink.className =
                "extra-download";


            downloadLink.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();


                    downloadBlob(
                        item.blob,
                        "compressed-" +
                        item.file.name
                    );
                }
            );


            card.appendChild(
                title
            );

            card.appendChild(
                stats
            );

            card.appendChild(
                downloadLink
            );


            // Insert cards before navigation

            individualResults.insertBefore(
                card,
                navigation
            );
        }
    );


    const totalPages =
        Math.ceil(
            compressedResults.length /
            RESULTS_PER_PAGE
        );


    pageInfo.textContent =
        `${startIndex + 1}–${endIndex} of ${compressedResults.length}`;


    const previousButton =
        document.getElementById(
            "prevPage"
        );


    const nextButton =
        document.getElementById(
            "nextPage"
        );


    previousButton.disabled =
        currentPage === 1;


    nextButton.disabled =
        currentPage === totalPages;
}


// ========================================
// DOWNLOAD BUTTONS
// ========================================

function createDownloadButtons(results) {

    downloadList.innerHTML = "";


    if (downloadURL) {

        URL.revokeObjectURL(
            downloadURL
        );

        downloadURL = null;
    }


    const firstResult =
        results[0];


    if (!firstResult) {
        return;
    }


    // ========================================
    // SINGLE IMAGE
    // ========================================

    if (results.length === 1) {

        downloadURL =
            URL.createObjectURL(
                firstResult.blob
            );


        downloadButton.href =
            downloadURL;


        downloadButton.download =
            "compressed-" +
            firstResult.file.name;


        downloadButton.textContent =
            "Download Compressed JPG";


        downloadButton.style.display =
            "inline-block";


        // Remove any previous batch click behavior

        downloadButton.onclick =
            null;


    // ========================================
    // MULTIPLE IMAGES
    // ========================================

    } else {

        // Main button becomes Download All as ZIP

        downloadButton.href =
            "#";


        downloadButton.removeAttribute(
            "download"
        );


        downloadButton.textContent =
            "Download All as ZIP";


        downloadButton.style.display =
            "inline-block";


        // Download ZIP when main button is clicked

        downloadButton.onclick =
            async function (event) {

                event.preventDefault();

                await createZipDownload(
                    compressedResults
                );
            };
    }


    resetButton.style.display =
        "block";
}


// ========================================
// DOWNLOAD BLOB
// ========================================

function downloadBlob(
    blob,
    filename
) {

    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement("a");


    link.href =
        url;


    link.download =
        filename;


    link.style.display =
        "none";


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    setTimeout(
        function () {

            URL.revokeObjectURL(
                url
            );

        },
        1000
    );
}


// ========================================
// LOAD JSZIP
// ========================================

function loadJSZip() {

    return new Promise(
        function (resolve, reject) {

            // Already loaded

            if (
                typeof JSZip !== "undefined"
            ) {

                resolve(JSZip);

                return;
            }


            const existingScript =
                document.querySelector(
                    'script[data-fileshrink-jszip="true"]'
                );


            if (existingScript) {

                existingScript.addEventListener(
                    "load",
                    function () {

                        resolve(JSZip);
                    }
                );


                existingScript.addEventListener(
                    "error",
                    function () {

                        reject(
                            new Error(
                                "Could not load ZIP library."
                            )
                        );
                    }
                );


                return;
            }


            const script =
                document.createElement("script");


            script.src =
                "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";


            script.async =
                true;


            script.dataset.fileshrinkJszip =
                "true";


            script.onload =
                function () {

                    if (
                        typeof JSZip !== "undefined"
                    ) {

                        resolve(JSZip);

                    } else {

                        reject(
                            new Error(
                                "ZIP library loaded incorrectly."
                            )
                        );
                    }
                };


            script.onerror =
                function () {

                    reject(
                        new Error(
                            "Could not load ZIP library."
                        )
                    );
                };


            document.head.appendChild(
                script
            );
        }
    );
}


// ========================================
// CREATE ZIP DOWNLOAD
// ========================================

async function createZipDownload(
    results
) {

    if (
        !results ||
        results.length === 0
    ) {
        return;
    }


    const downloadAllButton =
        document.getElementById(
            "downloadAllButton"
        );


    if (downloadAllButton) {

        downloadAllButton.disabled =
            true;

        downloadAllButton.textContent =
            "Creating ZIP...";
    }


    status.textContent =
        "Preparing ZIP download...";


    try {

        const Zip =
            await loadJSZip();


        const zip =
            new Zip();


        results.forEach(
            function (item, index) {

                const originalName =
                    item.file.name;


                const extension =
                    ".jpg";


                const baseName =
                    originalName
                        .replace(
                            /\.[^/.]+$/,
                            ""
                        );


                const filename =
                    `${String(index + 1).padStart(2, "0")}-${baseName}${extension}`;


                zip.file(
                    filename,
                    item.blob
                );
            }
        );


        status.textContent =
            "Creating ZIP file...";


        const zipBlob =
            await zip.generateAsync(
                {
                    type: "blob"
                }
            );


        downloadBlob(
            zipBlob,
            "FileShrink-compressed-images.zip"
        );


        status.textContent =
            `${results.length} images compressed successfully. ZIP download started.`;


    } catch (error) {

        console.error(
            "ZIP creation failed:",
            error
        );


        status.textContent =
            "Could not create ZIP. Please try again.";


    } finally {

        if (downloadAllButton) {

            downloadAllButton.disabled =
                false;

            downloadAllButton.textContent =
                "Download All as ZIP";
        }
    }
}


// ========================================
// CLEAR BATCH RESULTS
// ========================================

function clearBatchResults() {

    compressedResults =
        [];

    currentPage =
        1;


    clearBatchDownloadURLs();


    if (individualResults) {

        individualResults.innerHTML =
            "";
    }


    if (downloadList) {

        downloadList.innerHTML =
            "";
    }
}


// ========================================
// CLEAR BATCH DOWNLOAD URLS
// ========================================

function clearBatchDownloadURLs() {

    batchDownloadURLs.forEach(
        function (url) {

            URL.revokeObjectURL(
                url
            );
        }
    );


    batchDownloadURLs =
        [];
}


// ========================================
// HIDE BATCH UI
// ========================================

function hideBatchUI() {

    if (!individualResults) {
        return;
    }


    individualResults.innerHTML =
        "";
}


// ========================================
// RESET
// ========================================

resetButton.addEventListener(
    "click",
    function () {

        selectedFiles = [];

        compressedResults = [];

        currentPage = 1;


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


        downloadList.innerHTML =
            "";


        individualResults.innerHTML =
            "";


        clearBatchDownloadURLs();


        quality.value =
            70;


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


        preview.src =
            "";
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