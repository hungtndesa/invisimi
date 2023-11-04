var selectedItem = null;
var currentUploadMp4 = null;
var currentUploadJpeg = null;
var currentUploadName = null;
var currentUploadTag = null;
let currentPageIndex = 0;

function startLoad() {
    const mp4Holder = document.getElementById("mp4Holder");
    const jpegHolder = document.getElementById("jpegHolder");
    // JavaScript logic for handling the login
    document.getElementById("loginButton").addEventListener("click", function () {
        // Get the username and password from the input fields
        var username = document.getElementById("username").value;
        var password = document.getElementById("password").value;

        // Create a JSON object with the username and password
        var data = {
            "userName": username,
            "password": password
        };

        // Make a POST request to the API
        fetch("https://invisimi.com/videoliser/signIn", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("HTTP status " + response.status);
                }
                return response.text();
            })
            .then(response => {
                // Save the access token in localStorage
                localStorage.setItem('accessToken', response);
                showScreen("controlScreen");
                loadLogin();
                loadControlScreen();
            })
            .catch(error => {
                console.error("Error:", error);
                // Show error message
                document.getElementById("error").innerText = "Invalid username or password";
                document.getElementById("error").style.display = "block";
            });
    });
}

function loadLogin() {
    document.getElementById("templateUpdate").addEventListener("click", function () {
        if (selectedItem == null) {
            alert("Select an item first");
            return;
        }
        var inputName = document.getElementById("templateName");
        var inputTag = document.getElementById("templateTags");
        var updateName = inputName.value.trim()
        if (updateName.length === 0) {
            alert("Name is empty");
            return;
        }
        var updateTag = inputTag.value.trim()
        if (updateTag.length === 0) {
            alert("Tag is empty");
            return;
        }

        var updateObject = {
            "name": updateName,
            "tag": updateTag.split(",")
        };

        fetch("https://invisimi.com/videoliser/templates/" + selectedItem.id, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem('accessToken')
            },
            body: JSON.stringify(updateObject)
        }).then(response => response.text()).then(resText => {
            console.log(resText);
            searchTemplate(currentSearchQuery, currentPageIndex);
        })
    });


    // Enable drag and drop for MP4 and JPEG files
    var mp4Square = document.getElementById("mp4Square");
    var jpegSquare = document.getElementById("jpegSquare");

    mp4Square.ondragover = function (event) {
        event.preventDefault();
        mp4Square.classList.add("dragover");
    };

    mp4Square.ondragleave = function () {
        mp4Square.classList.remove("dragover");
    };

    mp4Square.ondrop = function (event) {
        event.preventDefault();
        mp4Square.classList.remove("dragover");
        var files = event.dataTransfer.files;
        handleDroppedFiles(files, "mp4");
    };

    jpegSquare.ondragover = function (event) {
        event.preventDefault();
        jpegSquare.classList.add("dragover");
    };

    jpegSquare.ondragleave = function () {
        jpegSquare.classList.remove("dragover");
    };

    jpegSquare.ondrop = function (event) {
        event.preventDefault();
        jpegSquare.classList.remove("dragover");
        var files = event.dataTransfer.files;
        handleDroppedFiles(files, "jpeg");
    };

    var submitButton = document.getElementById("submitButton");
    var isUploading = false;
    submitButton.addEventListener("click", function () {
        if (validateSubmit() && !isUploading) {
            const formData = new FormData();
            console.log(currentUploadMp4);
            formData.append("mp4File", currentUploadMp4, currentUploadMp4.name);
            formData.append("jpegFile", currentUploadJpeg, currentUploadJpeg.name);

            submitButton.textContent = "Loading";
            submitButton.disable = true;
            isUploading = true;

            let loadingIndicator = document.getElementById("loader")
            loadingIndicator.style.display = 'flex';
            fetch("https://invisimi.com/videoliser/templates", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem('accessToken')
                },
                body: formData
            }).then(response => response.text()).then(resText => {
                var updateObject = {
                    "name": currentUploadName,
                    "tag": currentUploadTag.split(",")
                };
                loadingIndicator.style.display = 'none';
                showAlertCompleted()
                fetch("https://invisimi.com/videoliser/templates/" + resText, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + localStorage.getItem('accessToken')
                    },
                    body: JSON.stringify(updateObject)
                }).then(response => response.text()).then(resText => {
                    console.log(currentPageIndex);
                    searchTemplate(currentSearchQuery, currentPageIndex);
                    mp4Holder.click();
                    jpegHolder.click();
                    document.getElementById("initName").value = "";
                    document.getElementById("initTags").value = "";

                    submitButton.textContent = "Submit";
                    submitButton.disable = false;
                    isUploading = false;
                })
            }).catch((response) => {
                console.log(response.status, response.statusText);
                showAlertError();
            });
        }
    });
    mp4Holder.addEventListener("click", function () {
        mp4Holder.textContent = "Mp4 File";
        currentUploadMp4 = null;
    });
    jpegHolder.addEventListener("click", function () {
        jpegHolder.textContent = "JPEG File";
        currentUploadJpeg = null;
    });

    const searchInput = document.getElementById("search-input");
    const searchButton = document.getElementById("search-button");

    searchButton.addEventListener("click", () => {
        const query = searchInput.value.trim();

        if (query.length === 0) {
            currentSearchQuery = "type=time&ascending=false";
            searchTemplate(currentSearchQuery, 0);
        } else {
            currentSearchQuery = "type=" + currentSearch + "&key=" + query;
            searchTemplate(currentSearchQuery, 0);
        }
    });

    const prevPageButton = document.getElementById("prevPage");
    const nextPageButton = document.getElementById("nextPage");

    prevPageButton.addEventListener("click", () => {
        if (currentPageIndex > 0) {
            currentPageIndex--;
        }
        if (currentPageIndex >= 0) {
            searchTemplate(currentSearchQuery, currentPageIndex);
        }
    });

    nextPageButton.addEventListener("click", () => {
        // In a real application, you would check if there are more pages to go to.
        currentPageIndex++;
        searchTemplate(currentSearchQuery, currentPageIndex);
    });
}
let switchState = false;
var currentSearch = "name";
function changeStateSwitch() {
    // Video
    const resultElement = document.getElementById("toggle-label");
    console.log(resultElement)
    resultElement.innerText = currentSearch;

    switchState = !switchState;
    if (switchState) {
        resultElement.innerHTML = "<b>Tag</b>";
        currentSearch = "tag";
    } else {
        resultElement.innerHTML = "<b>Name</b>";
        currentSearch = "name";
    }
}

function showScreen(screenId) {
    // Hide all screens
    var screens = document.querySelectorAll("section");
    screens.forEach(function (screen) {
        screen.style.display = "none";
    });

    // Show the specified screen
    document.getElementById(screenId).style.display = "flex";
}

function searchTemplate(query, index) {
    // Create the grid of red squares
    fetch("https://invisimi.com/videoliser/templates/search?" + query + "&index=" + index, {
        method: "GET"
    }).then(response => response.json())
        .then(data => {
            templateListReload(data);
        })
    const currentPageText = document.getElementById("currentPage");
    currentPageText.textContent = "  Page " + index + "  ";
}
var currentSearchQuery = "type=time&ascending=false";
function loadControlScreen() {
    searchTemplate("type=time&ascending=false", 0)
}

function templateListReload(templates) {
    var grid = document.getElementById("grid");
    while (grid.firstChild) {
        grid.removeChild(grid.firstChild);
    }
    var nameField = document.getElementById("templateName");
    var tagField = document.getElementById("templateTags");
    for (var i = 0; i < templates.length; i++) {
        var template = templates[i]

        let div = document.createElement("div");

        var square = document.createElement("img");

        square.className = "image";
        square.src = template.thumbnail;
        square.addEventListener("click", function (event) {
            var itemIndex = Array.from(grid.children).indexOf(event.target.parentElement);
            var template = templates[itemIndex];
            playVideo(template.path);
            nameField.value = template.name;
            tagField.value = template.tag.join(",");
            selectedItem = template;
            console.log(itemIndex);
        });

        const xButton = createXButton();
        xButton.addEventListener("click", function (event) {
            if (window.confirm("Do you want to delete item?")) {
                var itemIndex = (Array.from(grid.children).indexOf(event.target.parentElement));
                var template = templates[itemIndex];
                console.log(template)
                fetch("https://invisimi.com/videoliser/templates/" + template.id, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + localStorage.getItem('accessToken')
                    },
                }).then(response => response.text()).then(resText => {
                    console.log(currentPageIndex);
                    searchTemplate(currentSearchQuery, currentPageIndex);
                    selectedItem = null;

                    nameField.value = "";
                    tagField.value = "";
                })
            }
        });

        div.append(square)
        div.append(xButton)
        div.className = "image_cell"
        grid.appendChild(div);
    }
}


// Handle drag and drop
function allowDrop(event) {
    event.preventDefault();
}

function handleDrop(event, target) {
    event.preventDefault();
    var data = event.dataTransfer.getData("text");

    if (target === "mp4Square" && data === "mp4") {
        event.target.style.background = "green";
    }

    if (target === "jpegSquare" && data === "jpeg") {
        event.target.style.background = "blue";
    }
}

function validateSubmit() {
    var submitName = document.getElementById("initName");
    var submitTag = document.getElementById("initTags");
    currentUploadName = submitName.value;
    currentUploadTag = submitTag.value;
    if (currentUploadMp4 == null || currentUploadJpeg == null || currentUploadName == null || currentUploadTag == null) {
        alert("Missing required field");
        return false;
    } else {
        return true;
    }
}
function handleDroppedFiles(files, fileType) {
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (fileType === "mp4" && file.type.startsWith("video/mp4")) {
            currentUploadMp4 = file;
            mp4Holder.textContent = "Mp4 dropped, click to delete"
            console.log(currentUploadMp4);
        } else if (fileType === "jpeg" && file.type.startsWith("image/jpeg")) {
            currentUploadJpeg = file;
            jpegHolder.textContent = "Jpeg dropped, click to delete"
        } else {
            alert("Invalid file type. Please drop an MP4 or JPEG file.");
        }
    }
}

function playVideo(videoSource) {
    const video = document.getElementById('video');
    video.src = videoSource;
}

function closeVideo() {
    const videoContainer = document.getElementById('video-body');
    const video = document.getElementById('video');
    video.pause();
    videoContainer.style.display = 'none';
    video.src = ''; // Clear the video source
}

function createXButton() {
    const button = document.createElement("button");
    button.innerText = "X";
    button.className = "rounded-button";
    return button;
}

function showAlertCompleted() {
    Alert.success('Success! Upload completed', 'Success', { displayDuration: 3000, pos: 'top' })
}

function showAlertError() {
    Alert.error('Error! Something error. ', 'Error', { displayDuration: 3000 })
}

// Alert

var Alert = undefined;

(function (Alert) {
    var alert, error, trash, info, success, warning, _container;
    info = function (message, title, options) {
        return alert("info", message, title, "fa fa-info-circle", options);
    };
    warning = function (message, title, options) {
        return alert("warning", message, title, "fa fa-warning", options);
    };
    error = function (message, title, options) {
        return alert("error", message, title, "fa fa-exclamation-circle", options);
    };

    trash = function (message, title, options) {
        return alert("trash", message, title, "fa fa-trash-o", options);
    };

    success = function (message, title, options) {
        return alert("success", message, title, "fa fa-check-circle", options);
    };
    alert = function (type, message, title, icon, options) {
        var alertElem, messageElem, titleElem, iconElem, innerElem, _container;
        if (typeof options === "undefined") {
            options = {};
        }
        options = $.extend({}, Alert.defaults, options);
        if (!_container) {
            _container = $("#alerts");
            if (_container.length === 0) {
                _container = $("<ul>").attr("id", "alerts").appendTo($("body"));
            }
        }
        if (options.width) {
            _container.css({
                width: options.width
            });
        }
        alertElem = $("<li>").addClass("alert").addClass("alert-" + type);
        setTimeout(function () {
            alertElem.addClass('open');
        }, 1);
        if (icon) {
            iconElem = $("<i>").addClass(icon);
            alertElem.append(iconElem);
        }
        innerElem = $("<div>").addClass("alert-block");
        //innerElem = $("<i>").addClass("fa fa-times");
        alertElem.append(innerElem);
        if (title) {
            titleElem = $("<div>").addClass("alert-title").append(title);
            innerElem.append(titleElem);

        }
        if (message) {
            messageElem = $("<div>").addClass("alert-message").append(message);
            //innerElem.append("<i class="fa fa-times"></i>");
            innerElem.append(messageElem);
            //innerElem.append("<em>Click to Dismiss</em>");
            //      innerElemc = $("<i>").addClass("fa fa-times");

        }
        if (options.displayDuration > 0) {
            setTimeout((function () {
                leave();
            }), options.displayDuration);
        } else {
            innerElem.append("<em>Click to Dismiss</em>");
        }
        alertElem.on("click", function () {
            leave();
        });

        function leave() {
            alertElem.removeClass('open');
            alertElem.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function () {
                return alertElem.remove();
            });
        }
        return _container.prepend(alertElem);
    };
    Alert.defaults = {
        width: "",
        icon: "",
        displayDuration: 3000,
        pos: ""
    };
    Alert.info = info;
    Alert.warning = warning;
    Alert.error = error;
    Alert.trash = trash;
    Alert.success = success;
    return _container = void 0;

})(Alert || (Alert = {}));

this.Alert = Alert;

$('#test').on('click', function () {
    Alert.info('Message');
});