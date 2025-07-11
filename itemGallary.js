async function getLoc(desc, item_type, name_str) {
    let locs = JSON.parse(localStorage.getItem("itemLocation_json"));
    let weaponLocs = JSON.parse(localStorage.getItem("weaponLocation_json"));
    let reference = " ";
    if (name_str in locs) {
        reference = locs[name_str]["Location"];
    } else {
        if (name_str in weaponLocs) {
            reference = weaponLocs[name_str]["location"];
        }
    }
    const response = await fetch(
        'https://noggin.rea.gent/quixotic-hippopotamus-8180',
        {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer rg_v1_23875kejtov40kivlcwtsdqa2mmu5iz2y8bt_ngk',
        },
        body: JSON.stringify({
            // fill variables here.
            "item": `${item_type}: ` + name_str,
            "reference": reference + desc,
        }),
        }
    ).then(response => response.text());
    return response;
}

async function getPoem(item_type, name_str, desc) {
    let llm_desc = await fetch(
    'https://noggin.rea.gent/sticky-woodpecker-4218',
    {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer rg_v1_b7a5rrqswt9tg9qdahg0aynqwo43ynl4284c_ngk',
        },
        body: JSON.stringify({
        // fill variables here.
        "name": `${item_type}: ` + name_str,
        "desc": desc,
        }),
    }
    ).then(response => response.text());
    return llm_desc;
}

function loadItems(indicator, owned_items, not_owned_items, item_type, item_db) {    
    const container = document.querySelector("#armor-set");
    let item_names = [];
    if (indicator == "owned") {
        item_names = owned_items;
    } else {
        item_names = not_owned_items;
    }
    for (let idx = 0; idx < item_names.length; idx++) {
        const name = item_names[idx];
        const new_div = document.createElement("div");
        
        // too lazy to create a new CSS, just use armor-occupied
        new_div.className = "armor-occupied";
        const cleanItemName = name.replace(':', '');
        new_div.innerHTML = `<p>${name}</p> <img src="/assets/img/${item_type}/${cleanItemName}.webp" alt="${name}">`;
        VanillaTilt.init(new_div, {
            startX: -15,
            // startY: -20,
            scale: "1.2",
            reset_to_start: true,
            max: 25,
            speed: 400
        });
        new_div.addEventListener("click", ()=>{focus(name, indicator, owned_items, not_owned_items, item_type, item_db);});
        // new_div.style.zIndex = 2;
        container.appendChild(new_div);
    }
}

async function focus(item_name, indicator, owned_items, not_owned_items, item_type, item_db) {
    const sortBtn = document.querySelector("#sort-btn");
    const switchBtn = document.querySelector("#switch-btn");
    sortBtn.style.display = "none";
    switchBtn.style.display = "none";
    const containerDiv = document.querySelector(".container");
    const armorContainer = document.querySelector("#armor-set");
    const scrollBackPos = armorContainer.scrollTop;
    armorContainer.style.display = "none";
    // clearContainer("#armor-set");
    const itemDiv = document.createElement("div");
    itemDiv.className = 'items-container';
    const cleanItemName = item_name.replace(':', '');
    itemDiv.innerHTML = `<p style="font-weight:bold;">${item_name}</p>
            <img src="/assets/img/${item_type}/${cleanItemName}.webp" height=300px width=300px alt='${item_name}'>
            <p style="color: #da7d20;">Click to Go Back</p>`;
    itemDiv.addEventListener("click", ()=> {backTo(scrollBackPos, indicator, owned_items, not_owned_items, item_type, item_db)});
    itemDiv.style.width = "12%";
    containerDiv.appendChild(itemDiv);

    let desc = `Mysterious DLC ${item_name}`;
    if (item_name in item_db) {
        desc = item_db[item_name]["description"].join(" ");
    }
    
    const descrDiv = document.createElement("div");
    descrDiv.style.width = "67%";
    descrDiv.className = "items-container";
    if (indicator == "owned") {
        descrDiv.innerHTML = `<p class="items-title">LLM ${item_type}</p><p class="items-subtitle" style="color: #da7d20;">Click to Get Another Poem</p>`;
    } else {
        descrDiv.innerHTML = `<p class="items-title">LLM ${item_type}</p>`;
    }

    const sectionDiv = document.createElement("div");
    sectionDiv.className = "items-section";

    const attrDiv = document.createElement("div");
    attrDiv.className = "items";
    const capitalizedName = item_name.charAt(0).toUpperCase() + item_name.slice(1);
    if (indicator == "owned") {
        attrDiv.innerHTML = `<p>${capitalizedName} Description:</p> <p>LLM Generated Poem:</p>`;
    } else {
        attrDiv.innerHTML = `<p>${capitalizedName} Description:</p> <p>LLM Generated Location:</p>`;
    }
    
    const loadDiv = document.createElement("div");
    loadDiv.className = "loaded-items";
    
    if (indicator == "owned") {
        loadDiv.innerHTML = `<p><span>${desc}</span></p> <p><span>Loading Poem</span></p>`;
        getPoem(item_type, item_name, desc).then(poem => {
            loadDiv.innerHTML = `<p><span>${desc}</span></p> <p><span>${poem}</span></p>`;
        });
        descrDiv.addEventListener("click", ()=> {
            loadDiv.innerHTML = `<p><span>${desc}</span></p> <p><span>Loading a New Poem...</span></p>`;
            getPoem(item_type, item_name, desc).then(poem => {
            loadDiv.innerHTML = `<p><span>${desc}</span></p> <p><span>${poem}</span></p>`;
            });
        });
    } else {
        loadDiv.innerHTML = `<p><span>${desc}</span></p> <p><span>Loading Location</span></p>`;
        getLoc(desc, item_type, item_name,).then(loc => {
        const link_start = loc.indexOf('[');
        const link_end = loc.indexOf(']');
        const pureDes = loc.slice(0, link_start);
        const link = loc.slice(link_start + 1, link_end);
        loadDiv.innerHTML = `<p><span>${desc}</span></p> <p><span>${pureDes}<a href='${link}' target='_blank'>${link}</a></span></p>`;
        });
    }
    sectionDiv.appendChild(attrDiv);
    sectionDiv.appendChild(loadDiv);
    descrDiv.appendChild(sectionDiv);
    containerDiv.appendChild(descrDiv);
}

function sort(indicator, owned_items, not_owned_items, item_type, item_db) {
    confetti({
    particleCount: 500,
    startVelocity:70, 
    gravity: 0.7, 
    angle: -135,
    spread: 90,
    origin: { y: 0.1, x:0.9 },
    colors: ['#f5d742'],
    scalar: 5
    });
    clearContainer("#armor-set");
    if (indicator == "owned") {
        owned_items.sort();
    } else {
        not_owned_items.sort();
    }
    loadItems(indicator, owned_items, not_owned_items, item_type, item_db);
}
function switchTo(indicator, owned_items, not_owned_items, item_type, item_db) {
    confetti({
    particleCount: 500,
    startVelocity:70, 
    gravity: 0.7, 
    angle: -135,
    spread: 90,
    origin: { y: 0.1, x:0.9 },
    colors: ['#f5d742'],
    scalar: 5
    });
    const item_type_capital = item_type.toUpperCase();
    const switchBtn = document.querySelector("#switch-btn");
    const title = document.querySelector("#title");
    clearContainer("#armor-set");
    if (switchBtn.textContent.includes("NOT-OWNED")) {
        switchBtn.textContent = `SWITCH TO OWNED ${item_type_capital}S`;
        title.textContent = `Player's MISSED ${item_type_capital}S`;    
    } else {
        switchBtn.textContent = `SWITCH TO NOT-OWNED ${item_type_capital}S`;
        title.textContent = `Player's OWNED ${item_type_capital}S`;
    }
    loadItems(indicator, owned_items, not_owned_items, item_type, item_db);
}
function backTo(scrollPos, indicator, owned_items, not_owned_items, item_type, item_db) {
    const sortBtn = document.querySelector("#sort-btn");
    const switchBtn = document.querySelector("#switch-btn");
    sortBtn.style.display = "block";
    switchBtn.style.display = "block";
    clearContainer("#big-container");
    const armorContainer = document.createElement("div");
    armorContainer.className = "armor-container";
    armorContainer.id = "armor-set";
    const bigContainer = document.querySelector("#big-container");
    bigContainer.appendChild(armorContainer);
    loadItems(indicator, owned_items, not_owned_items, item_type, item_db);
    armorContainer.scrollTop = scrollPos || 0;
}

function clearContainer(divID) {
    const container = document.querySelector(divID);
    if (container.childElementCount != 0) {
        while(container.firstChild) { 
            container.removeChild(container.firstChild); 
        }
    } 
}