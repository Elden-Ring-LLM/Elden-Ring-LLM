const pattern = new Uint8Array([0xB0, 0xAD, 0x01, 0x00, 0x01, 0xFF, 0xFF, 0xFF]);
const pattern_dlc = new Uint8Array([0xB0, 0xAD, 0x01, 0x00, 0x01]);
let isDlcFile = false;


let file_read = null;
let inventory = null;
let result = { worked: false, owned: null, "not-owned": null, counter: null };
let save_json = null;
var all_items = null;
var item_counter = null;
var item_dict_template = null;
let talismans_dictionary = null;
let dlc_items_dictionary = null;
let armors_dictionary = null;
// let armaments_dictionary = null;
let listened_save_file = null;
let spells_dictionary = null;
let spiritAshes_dictionary = null;
let ashesOfWar_dictionary = null;

function pushNotification(txt) {
  const notification = new Notification("Elden Ring LLM", {
    body: txt,
  });
}

function isValidJSON(data) {
  try {
      JSON.parse(data);
      return true;
  } catch (e) {
      return false;
  }
}

function getSaveFileFromListening() {
  if (localStorage.getItem("save_json") != null) {
    save_json = JSON.parse(localStorage.getItem("save_json"));
    window.location.href = 'profile.html';
    pushNotification(`Welcome back ${save_json.character}! Your save file is successfully loaded! You can start playing your Elden Ring, and we are actively monitoring your save file.🫡`);
    return;
  }
  const ws = new WebSocket('ws://localhost:8080');
  ws.binaryType = 'arraybuffer';
  ws.onmessage = function(event) {
    function handleFileChange(fileData) {
      pushNotification("Save File Changed");
    }

    listened_save_file = event.data;
    if (listened_save_file === null) {
      alert("No Save Files Detected!");
      return;
    }
    if (isValidJSON(listened_save_file)) {
      const message = JSON.parse(event.data);
      if (message.type === 'file-change') {
          handleFileChange(message.data);
      }
      listened_save_file = message.data;
    }
    let reader = new FileReader();
    reader.onload = function (e) {
      file_read = e.target.result;
      if (!buffer_equal(file_read["slice"](0, 4), new Int8Array([66, 78, 68, 52]))) {
        e.target.result = null;
        alert("Is your Save File corrupted?");
        return;
      }
      getJsonFiles();
      result = getOwnedAndNot(file_read, 0);
      if (result["worked"]) {
        // $("#owned").load("page_parts.html #owned_section", () => {
        //   $("#not-owned").load("page_parts.html #not-owned-section", () => {
        //     document.getElementById("collapse_button1").style.display = "block";
        //     document.getElementById("collapse_button2").style.display = "block";
        //     addFraction();
        //   });
        // });
        let jsonObject = {
          character: getNames(file_read)[0],
          steamID: getSteamId(file_read),
          stats: get_stats(file_read, 0),
          level: getLevels(file_read)[0],
          playTime_Hrs: getPlayTimesInHrs(file_read)[0],
          equippedArmor: getEquippedArmor(file_read),
          equippedTalismans: getEquippedTalismans(file_read),
          owned: result.owned,
          "not-owned": result["not-owned"],
          counter: result.counter
        };
        save_json = JSON.stringify(jsonObject, null, 2);
        localStorage.setItem("save_json", save_json);
        localStorage.setItem("armor_json", JSON.stringify(armors_dictionary, null, 2));
        localStorage.setItem("stats", jsonObject.stats);
        localStorage.setItem("stats", JSON.stringify(jsonObject.stats));
        // localStorage.setItem("armament_json", JSON.stringify(armaments_dictionary, null, 2));
        localStorage.setItem("talisman_json", JSON.stringify(talismans_dictionary, null, 2));
        localStorage.setItem("spell_json", JSON.stringify(spells_dictionary, null, 2));
        localStorage.setItem("spirit_ash_json", JSON.stringify(spiritAshes_dictionary, null, 2));
        localStorage.setItem("ash_of_war_json", JSON.stringify(ashesOfWar_dictionary, null, 2));
        // console.log(localStorage.getItem("spell_json"));
        window.location.href = 'profile.html';
        pushNotification(`Welcome back ${jsonObject.character}! Your save file is successfully loaded! You can start playing your Elden Ring, and we are actively monitoring your save file.🫡`);
      }
    };
    reader.onerror = function (e) {
      // error occurred
      console.log("Error : " + e.type);
    };
    reader.readAsArrayBuffer(new Blob([listened_save_file]));
  };
  ws.onopen = function() {
      console.log('WebSocket connection opened');
  };
  ws.onerror = function(error) {
      console.error('WebSocket error:', error);
      // dowload websocket.js
      let link = document.createElement("a");
      link.href = "assets/js/websocket.js";
      link.download = "websocket.js";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.location.href = '404Socket.html';
  };
}

function getSaveFileFromUploading() {
  let options = $("#slot_selector option:selected");
  let selected_slot = options[0].value;
  localStorage.setItem("selected_slot", selected_slot);
  localStorage.setItem("selected_slot_name", getNames(file_read)[selected_slot]);
  let file = document.querySelector("#savefile").files[0];
  let reader = new FileReader();
  reader.onload = function (e) {
    file_read = e.target.result;
    if (!buffer_equal(file_read["slice"](0, 4), new Int8Array([66, 78, 68, 52]))) {
      e.target.result = null;
      alert("Is your Save File corrupted?");
      return;
    }
    getJsonFiles();
    result = getOwnedAndNot(file_read, selected_slot);
    if (result["worked"]) {
      let jsonObject = {
        character: localStorage.getItem("selected_slot_name"),
        steamID: getSteamId(file_read),
        stats: get_stats(file_read, selected_slot),
        level: getLevels(file_read)[selected_slot],
        playTime_Hrs: getPlayTimesInHrs(file_read)[selected_slot],
        equippedArmor: getEquippedArmor(file_read),
        equippedTalismans: getEquippedTalismans(file_read),
        owned: result.owned,
        "not-owned": result["not-owned"],
        counter: result.counter
      };
      save_json = JSON.stringify(jsonObject, null, 2);
      localStorage.setItem("save_json", save_json);
      localStorage.setItem("character", jsonObject.character);
      // localStorage.setItem("equippedArmor", jsonObject.equippedArmor);
      localStorage.setItem("stats", JSON.stringify(jsonObject.stats));
      localStorage.setItem("armor_json", JSON.stringify(armors_dictionary, null, 2));
      // localStorage.setItem("armament_json", JSON.stringify(armaments_dictionary, null, 2));
      localStorage.setItem("talisman_json", JSON.stringify(talismans_dictionary, null, 2));
      localStorage.setItem("spell_json", JSON.stringify(spells_dictionary, null, 2));
      localStorage.setItem("spirit_ash_json", JSON.stringify(spiritAshes_dictionary, null, 2));
      localStorage.setItem("ash_of_war_json", JSON.stringify(ashesOfWar_dictionary, null, 2));
      // console.log(localStorage.getItem("spell_json"));
      window.location.href = 'profile.html';
      pushNotification(`Welcome back ${jsonObject.character}! Your save file is successfully loaded! You can start playing your Elden Ring, and we are actively monitoring your save file.🫡`);
    }
  };
  reader.readAsArrayBuffer(new Blob([file]));
  // console.log(JSON.parse(localStorage.getItem("equippedArmor")));
}

function calculate() {
  let options = $("#slot_selector option:selected");
  let selected_slot = options[0].value;
  localStorage.setItem("selected_slot", selected_slot);
  getJsonFiles();
  result = getOwnedAndNot(file_read, selected_slot);
  if (result["worked"]) {
    // $("#owned").load("page_parts.html #owned_section", () => {
    //   $("#not-owned").load("page_parts.html #not-owned-section", () => {
    //     document.getElementById("collapse_button1").style.display = "block";
    //     document.getElementById("collapse_button2").style.display = "block";
    //     addFraction();
    //   });
    // });
    save_json = generateJSON();
    if (save_json) {
      downloadJSON(save_json, "game_data.json");
    }
  }
}

function fetchJson(url, callback) {
  $.ajax({
    url: url,
    async: false,
    dataType: "json",
    success: callback,
  });
}

function generateJSON() {
  getJsonFiles();
  if (!file_read) {
    console.error("No file read. Please select a file first.");
    return null;
  }
  // let options = $("#slot_selector option:selected");
  let selected_slot = localStorage.getItem("selected_slot");
  let result = getOwnedAndNot(file_read, selected_slot);
  if (!result["worked"]) {
    console.error("Failed to process the file. Ensure the file is valid.");
    return null;
  }
  let jsonObject = {
    character: localStorage.getItem("selected_slot_name"),
    steamID: getSteamId(file_read),
    stats: get_stats(file_read, selected_slot),
    level: getLevels(file_read)[selected_slot],
    playTime_Hrs: getPlayTimesInHrs(file_read)[selected_slot],
    equippedArmor: getEquippedArmor(file_read),
    equippedTalismans: getEquippedTalismans(file_read),
    owned: result.owned,
    "not-owned": result["not-owned"],
    counter: result.counter
  };
  let jsonString = JSON.stringify(jsonObject, null, 2);
  return jsonString;
}

function downloadJSON(jsonString, filename) {
  let blob = new Blob([jsonString], { type: "application/json" });

  let link = document.createElement("a");

  link.download = filename;

  link.href = window.URL.createObjectURL(blob);

  document.body.appendChild(link);

  link.click();
  document.body.removeChild(link);
}

function getJsonFiles() {
  fetchJson("assets/json/all_items.json", function (data) {
    all_items = { ...data };

    if ($("#altered-armor").is(":checked")) {
      fetchJson("assets/json/altered_armor.json", function (data2) {
        all_items.armor = { ...all_items.armor, ...data2 };
      });
    }

    if ($("#unobtainable-items").is(":checked")) {
      fetchJson("assets/json/unobtainable.json", function (data2) {
        all_items.armor = { ...all_items.armor, ...data2.armor };
        all_items.talisman = { ...all_items.talisman, ...data2.talisman };
      });
    }

    if ($("#dlc-items").is(":checked")) {
      fetchJson("assets/json/dlc_items.json", function (data2) {
        all_items.armament = { ...all_items.armament, ...data2.armament };
        all_items.armor = { ...all_items.armor, ...data2.armor };
        all_items.talisman = { ...all_items.talisman, ...data2.talisman };
        all_items.ashesOfWar = { ...all_items.ashesOfWar, ...data2.ashesOfWar };
        all_items.magic = { ...all_items.magic, ...data2.magic };
        all_items.spiritAshes = { ...all_items.spiritAshes, ...data2.spiritAshes };
      });
    }
  });

  fetchJson("assets/json/item_dict_template.json", function (data) {
    item_dict_template = { ...data };
  });

  fetchJson("assets/json/item_counter.json", function (data) {
    item_counter = { ...data };
  });

  fetchJson("erdb/json/talismans.json", function (data) {
    talismans_dictionary = { ...data };
  });

  fetchJson("erdb/json/dlc_items.json", function (data) {
    dlc_items_dictionary = { ...data };
  });

  fetchJson("erdb/json/armor.json", function (data) {
    armors_dictionary = { ...data };
  });

  // fetchJson("erdb/json/armaments.json", function (data) {
  //   armaments_dictionary = { ...data };
  // });

  fetchJson("erdb/json/spells.json", function (data) {
    spells_dictionary = { ...data };
  });

  fetchJson("erdb/json/spirit-ashes.json", function (data) {
    spiritAshes_dictionary = { ...data };
  });

  fetchJson("erdb/json/ashes-of-war.json", function (data) {
    ashesOfWar_dictionary = { ...data };
  });
}

// function l_endian(val) {
//   let l_hex = Buffer.from(val).reverse(); // Reverse the order of bytes
//   let str_l = Array.from(l_hex).map(byte => byte.toString(16).padStart(2, '0')).join(''); // Convert bytes to hex string
//   return parseInt(str_l, 16); // Convert hex string to integer
// }
function l_endian(val) {
  // Create a Uint8Array from the input bytes and reverse it
  let l_hex = new Uint8Array(val).reverse();
  // Convert the reversed bytes to a hex string
  let str_l = Array.from(l_hex).map(byte => byte.toString(16).padStart(2, '0')).join('');
  // Convert the hex string to an integer
  return parseInt(str_l, 16);
}

function getSteamId(file_read) {
  let steamId = file_read.slice(26215348, 26215356); // Get steamID
  return l_endian(steamId);
}

function getSoulsMemory(file_read) {
  let data = file_read;
  let ind1 = 0x01901D38; // Start address of char names in header, 588 bytes apart
  let nm = data.slice(ind1, ind1 + 4);
  return l_endian(nm);
}

function getSouls(file_read) {
  let data = file_read;
  let idx = 0x0000D020;
  return l_endian(data.slice(idx, idx + 4));
}

function getLevels(file_read) {
  let data = file_read;
  let ind = 0x1901D0E + 34;
  let lvls = [];
  for (let i = 0; i < 10; i++) {
      let l = data.slice(ind, ind + 2);
      lvls.push(l_endian(l));
      ind += 588;
  }
  return lvls;
}

function getPlayTimesInHrs(file_read) {
  const times = [0x1901d0e+38, 0x1901f5a+38, 0x19021a6+38, 0x19023f2+38, 0x190263e+38, 0x190288a+38, 0x1902ad6+38, 0x1902d22+38, 0x1902f6e+38, 0x19031ba+38];
  let data = file_read;
  return times.map(time => l_endian(data.slice(time, time + 4)) / 3600);
}

function getAttrs(file_read) {
  let data = file_read;
  let idx = 0x0000CFC4;
  let stat = {};
  const attrNames = ["HP", "max HP", "base max HP", "FP", "max FP", "base max FP", "Placeholder Address", "SP", "max SP", "base max SP", "Placeholder Address", "Vigor", "Mind", "Endurance", "Strength", "Dexterity", "Intelligence", "Faith", "Arcane"];
  attrNames.forEach(attrName => {
      stat[attrName] = l_endian(data.slice(idx, idx + 4));
      idx += 4;
  });
  // delete stat["Placeholder Address"];
  return stat;
}


function getEquippedTalismans(file_read) {
  const dat1 = file_read;
  const talismanIds = [];
  let idx = 0x01901ED0;
  while (l_endian(dat1.slice(idx, idx + 2)) !== 0) {
      const nm = dat1.slice(idx, idx + 2);
      talismanIds.push(l_endian(nm));
      idx += 4;
  }
  const tali = talismanIds.map(id => getTalismanName(id));
  localStorage.setItem("equippedTalismans", JSON.stringify(tali));
  return tali;
}

function getTalismanName(id) {
  const taliDb = talismans_dictionary;
  for (const key in taliDb) {
      if (taliDb[key]["id"] === id) {
          return key;
      }
  }
  const dlcDb = dlc_items_dictionary;
  for (const key in dlcDb["talisman"]) {
      if (key.endsWith(id.toString(16).toUpperCase())) {
          return dlcDb["talisman"][key]["name"];
      }
  }
  return null;
}

function getEquippedArmor(file_read) {
    /**
     * Takes an elden ring save file(.sl2) path.
     *
     * Args:
     *     file: path to the file.
     *
     * Returns:
     *     dict: dictionary of equipped armor, including head, chest, arms, legs
     *
     * Raises:
     *     None.
     */
    const data = file_read;
    let idx = 0x01901F14;
    const armorNames = ['head', 'chest', 'arms', 'legs'];
    const armors = {};

    armorNames.forEach((armorName) => {
        armors[armorName] = getArmorName(l_endian(data.slice(idx, idx + 4)).toString(16).toUpperCase());
        idx += 4;
    });

    localStorage.setItem("equippedArmor", JSON.stringify(armors));
    // console.log(armors);
    return armors;
}

function getArmorName(idInHex) {
    const armorDb = armors_dictionary;
    for (const key in armorDb) {
        if (armorDb[key]["full_hex_id"].endsWith(idInHex)) {
            return key;
        }
    }
    const dlcDb = dlc_items_dictionary;
    for (const key in dlcDb["armor"]) {
        if (key.endsWith(idInHex)) {
            return dlcDb["armor"][key]["name"];
        }
    }
    return null;
}

function get_slot_ls(data) {
  const slots = [];
  slots.push(data.slice(0x00000310, 0x0028030F + 1));
  slots.push(data.slice(0x00280320, 0x050031F + 1));
  slots.push(data.slice(0x0500330, 0x078032F + 1));
  slots.push(data.slice(0x0780340, 0x0A0033F + 1));
  slots.push(data.slice(0x0A00350, 0x0C8034F + 1));
  slots.push(data.slice(0x0C80360, 0x0F0035F + 1));
  slots.push(data.slice(0x0F00370, 0x118036F + 1));
  slots.push(data.slice(0x1180380, 0x140037F + 1));
  slots.push(data.slice(0x1400390, 0x168038F + 1));
  slots.push(data.slice(0x16803A0, 0x190039F + 1));
  return slots;
}

function get_levels(file_read) {
  const data = file_read;
  const levels = [];
  let index = 0x1901D0E + 34;
  for (let i = 0; i < 10; i++) {
      const level = data.slice(index, index + 2);
      levels.push(l_endian(level));
      index += 588;
  }
  return levels;
}

function get_stats(file_read, char_slot) {
  try {
      const lvls = get_levels(file_read);  // Get the levels of all characters
      const lv = lvls[char_slot];  // Get the level of the specified character slot
      const slots = get_slot_ls(file_read);  // Get the character slots
      const slot1 = slots[char_slot];  // Get the slot data for the specified character slot
      let start_ind = 0;
      const indexes = [];  // List to store the indexes of the stats
      let level_ind = 0;

      for (let ind = 0; ind < slot1.byteLength; ind++) {
          if (ind > 120000) {
              return null;
          }

          try {
              // Extract the individual stats using little-endian encoding
            const stats = [];
            for (let i = 0; i < 29; i += 4) {
                stats.push(l_endian(slot1.slice(ind + i, ind + i + 1)));
            }

            // Check if the sum of stats equals the level plus 79,
            // and the level index matches the level
            if (stats.reduce((a, b) => a + b, 0) === lv + 79 && l_endian(slot1.slice(ind + 44, ind + 46)) === lv) {
                start_ind = ind;
                level_ind = ind + 44;
                break;
            }

          } catch (error) {
              continue;
          }
      }

      indexes.push(start_ind, start_ind + 4, start_ind + 8, start_ind + 12, start_ind + 16, start_ind + 20, start_ind + 24, start_ind + 28);
      indexes.push(level_ind);
      function get_stats_from_slot(start_index, offset, count) {
          const stats = [];
          for (let i = 0; i < count; i++) {
              stats.push(l_endian(slot1.slice(start_index - offset + i * 4, start_index - offset + i * 4 + 2)));
          }
          return stats;
      }

      const hp = get_stats_from_slot(start_ind, 44, 3);
      const stamina = get_stats_from_slot(start_ind, 16, 3);
      const fp = get_stats_from_slot(start_ind, 32, 3);
      const attrs = get_stats_from_slot(start_ind, 0, 12);
      const souls = l_endian(slot1.slice(start_ind + 48, start_ind + 48 + 4))
      const souls_memory = l_endian(slot1.slice(start_ind + 48 + 4, start_ind + 48 + 8))
      const stats_names = ["HP", "max HP", "base max HP", "Stamina", "max Stamina", "base max Stamina", "FP", "max FP", "base max FP", 
                          "Vigor", "Mind", "Endurance", "Strength", "Dexterity", "Intelligence", "Faith", "Arcane", "Placeholder Addr1", "Placeholder Addr2", 
                          "Placeholder Addr3", "level", "souls", "souls memory"];
      let stats = {};
      const concat_lst = [...hp, ...stamina, ...fp, ...attrs, souls, souls_memory];
      // console.log(hp);
      for (let i = 0; i < stats_names.length; i++) {
        let stats_name = stats_names[i];
        stats[stats_name] = concat_lst[i];
      }
      return stats;
  } catch (error) {
      return null;
  }
}

function subfinder(mylist, pattern) {
  for (let i = 0; i < mylist.byteLength; i++) {
    if (mylist[i] === pattern[0] && buffer_equal(mylist.subarray(i, i + pattern.byteLength), pattern)) return i;
  }
}

function buffer_equal(buf1, buf2) {
  if (buf1.byteLength !== buf2.byteLength) return false;
  let dv1 = new Int8Array(buf1);
  let dv2 = new Int8Array(buf2);
  for (let i = 0; i !== buf1.byteLength; i++) {
    if (dv1[i] !== dv2[i]) return false;
  }
  return true;
}

function getInventory(slot) {
  index = subfinder(slot, pattern) + pattern.byteLength + 8
  if (!index) {
      index = subfinder(slot, pattern_dlc) + pattern_dlc.byteLength + 3
      isDlcFile = true
  }
  index1 = subfinder(slot.subarray(index, slot.byteLength), new Uint8Array(50).fill(0)) + index + 6;
  return slot.subarray(index, index1);
}

function split(list_a, chunk_size) {
  let splitted = [];
  for (let i = 0; i < list_a.length; i += chunk_size) {
    let chunk = list_a.slice(i, i + chunk_size);
    splitted.push(chunk);
  }
  return splitted;
}

function getIdReversed(id) {
  let final_id = "";
  tmp = id.slice(0, 4).reverse();
  for (let i = 0; i < 4; i++) {
    final_id += decimalToHex(tmp[i], 2);
  }
  return final_id;
}

function decimalToHex(d, padding) {
  let hex = Number(d).toString(16);
  padding = typeof padding === "undefined" || padding === null ? (padding = 2) : padding;

  while (hex.length < padding) {
    hex = "0" + hex;
  }
  return hex;
}

function getOwnedAndNot(file_read, selected_slot) {
  try {
    let saves_array = new Uint8Array(file_read);
    let slots = get_slot_ls(saves_array);
    let inventory = Array.from(getInventory(slots[selected_slot]));
    let id_list = split(inventory, isDlcFile ? 8 : 16)
    id_list.forEach((raw_id, index) => (id_list[index] = getIdReversed(raw_id).toUpperCase()));

    let owned_items = JSON.parse(JSON.stringify(item_dict_template));
    let not_owned_items = JSON.parse(JSON.stringify(item_dict_template));

    id_list.forEach((id) => {
      if (id in all_items["armament"]) {
        // console.log(id)
        owned_items["armament"][all_items["armament"][id]["class"]].push(all_items["armament"][id]["name"]);
        item_counter["armament"][all_items["armament"][id]["class"]]["owned"]++;
        item_counter["armament"][all_items["armament"][id]["class"]]["total"]++;
        item_counter["armament"]["summary"]["owned"]++;
        item_counter["armament"]["summary"]["total"]++;
        delete all_items["armament"][id];
      } else if (id in all_items["armor"]) {
        owned_items["armor"][all_items["armor"][id]["category"]].push(all_items["armor"][id]["name"]);
        item_counter["armor"][all_items["armor"][id]["category"]]["owned"]++;
        item_counter["armor"][all_items["armor"][id]["category"]]["total"]++;
        item_counter["armor"]["summary"]["owned"]++;
        item_counter["armor"]["summary"]["total"]++;
        delete all_items["armor"][id];
      } else if (id in all_items["ashesOfWar"]) {
        owned_items["ashesOfWar"][all_items["ashesOfWar"][id]["category"]].push(all_items["ashesOfWar"][id]["name"]);
        item_counter["ashesOfWar"][all_items["ashesOfWar"][id]["category"]]["owned"]++;
        item_counter["ashesOfWar"][all_items["ashesOfWar"][id]["category"]]["total"]++;
        item_counter["ashesOfWar"]["summary"]["owned"]++;
        item_counter["ashesOfWar"]["summary"]["total"]++;
        delete all_items["ashesOfWar"][id];
      } else if (id in all_items["magic"]) {
        owned_items["magic"][all_items["magic"][id]["category"]].push(all_items["magic"][id]["name"]);
        item_counter["magic"][all_items["magic"][id]["category"]]["owned"]++;
        item_counter["magic"][all_items["magic"][id]["category"]]["total"]++;
        item_counter["magic"]["summary"]["owned"]++;
        item_counter["magic"]["summary"]["total"]++;
        delete all_items["magic"][id];
      } else if (id in all_items["spiritAshes"]) {
        owned_items["spiritAshes"].push(all_items["spiritAshes"][id]["name"]);
        item_counter["spiritAshes"]["summary"]["owned"]++;
        item_counter["spiritAshes"]["summary"]["total"]++;
        delete all_items["spiritAshes"][id];
      } else if (id in all_items["talisman"]) {
        owned_items["talisman"].push(all_items["talisman"][id]["name"]);
        item_counter["talisman"]["summary"]["owned"]++;
        item_counter["talisman"]["summary"]["total"]++;
        delete all_items["talisman"][id];
      }
    });

    for (let item_type in all_items) {
      for (let id in all_items[item_type]) {
        if (item_type === "armament") {
          not_owned_items["armament"][all_items["armament"][id]["class"]].push(all_items["armament"][id]["name"]);
          item_counter[item_type][all_items[item_type][id]["class"]]["not-owned"]++;
          item_counter[item_type][all_items[item_type][id]["class"]]["total"]++;
          item_counter[item_type]["summary"]["not-owned"]++;
          item_counter[item_type]["summary"]["total"]++;
        } else if (item_type === "armor" || item_type === "ashesOfWar" || item_type === "magic") {
          not_owned_items[item_type][all_items[item_type][id]["category"]].push(all_items[item_type][id]["name"]);
          item_counter[item_type][all_items[item_type][id]["category"]]["not-owned"]++;
          item_counter[item_type][all_items[item_type][id]["category"]]["total"]++;
          item_counter[item_type]["summary"]["not-owned"]++;
          item_counter[item_type]["summary"]["total"]++;
        } else if (item_type === "spiritAshes" || item_type === "talisman") {
          not_owned_items[item_type].push(all_items[item_type][id]["name"]);
          item_counter[item_type]["summary"]["not-owned"]++;
          item_counter[item_type]["summary"]["total"]++;
        }
      }
    }
    return { worked: true, owned: owned_items, "not-owned": not_owned_items, counter: item_counter };
  } catch (err) {
    console.log(err);
    console.log("insert a valid file");
    return { worked: false, owned: null, "not-owned": null, counter: null };
  }
}

function getNames(file_read) {
  let decoder = new TextDecoder("utf-8");
  let name1 = decoder.decode(new Int8Array(Array.from(new Uint16Array(file_read.slice(0x1901d0e, 0x1901d0e + 32)))));
  let name2 = decoder.decode(new Int8Array(Array.from(new Uint16Array(file_read.slice(0x1901f5a, 0x1901f5a + 32)))));
  let name3 = decoder.decode(new Int8Array(Array.from(new Uint16Array(file_read.slice(0x19021a6, 0x19021a6 + 32)))));
  let name4 = decoder.decode(new Int8Array(Array.from(new Uint16Array(file_read.slice(0x19023f2, 0x19023f2 + 32)))));
  let name5 = decoder.decode(new Int8Array(Array.from(new Uint16Array(file_read.slice(0x190263e, 0x190263e + 32)))));
  let name6 = decoder.decode(new Int8Array(Array.from(new Uint16Array(file_read.slice(0x190288a, 0x190288a + 32)))));
  let name7 = decoder.decode(new Int8Array(Array.from(new Uint16Array(file_read.slice(0x1902ad6, 0x1902ad6 + 32)))));
  let name8 = decoder.decode(new Int8Array(Array.from(new Uint16Array(file_read.slice(0x1902d22, 0x1902d22 + 32)))));
  let name9 = decoder.decode(new Int8Array(Array.from(new Uint16Array(file_read.slice(0x1902f6e, 0x1902f6e + 32)))));
  let name10 = decoder.decode(new Int8Array(Array.from(new Uint16Array(file_read.slice(0x19031ba, 0x19031ba + 32)))));

  let names = [name1, name2, name3, name4, name5, name6, name7, name8, name9, name10];
  names.forEach((name, index) => {
    names[index] = name.replaceAll("\x00", "");
  });
  return names;
}

function updateSlotDropdown(slot_name_list) {
  let select = document.getElementById("slot_select");
  select.innerHTML = `<i class="icofont-rounded-right"></i> <strong>Select slot: </strong>
        <select class="form-select" aria-label="Select slot" id="slot_selector">
         <option hidden selected>Choose one of Game Profile</option>`;
  let selector = select.getElementsByTagName("select")[0];
  for (let i = 0; i < 10; i++) {
    if (slot_name_list[i] === "") {
      selector.innerHTML += `<option value="${i}" disabled> - </option>`;
    } else {
      selector.innerHTML += `<option value="${i}"> ${slot_name_list[i]} </option>`;
    }
  }
  select.style.display = "block";
}

function getCard(item_name, category_name) {
  return `<div class=".col-6 .col-sm-4 .col-md-3 .col-lg-2 col-xl-2">
<div class="card" title="${item_name}" > 
<img alt="${item_name} img" class="lazy item-img card-img"
           src="https://acegif.com/wp-content/uploads/loading-25.gif"
					 data-src="./assets/img/${category_name}/${item_name.replace(/[\:]+/g, "")}.webp"
					 title="${item_name}">
<br>
<p class="card-text">${item_name}</p>
<a href="https://eldenring.wiki.fextralife.com/${item_name.replace(/ \+\d+$/, "").replaceAll(" ", "+")}" class="stretched-link" target="_blank"> </a> </div>
</div>`;
}

function getCategorySection(category, owned) {
  let category_container;
  if (owned === "owned") {
    category_container = document.getElementById(`owned-${category}`);
  } else if (owned === "not-owned") {
    category_container = document.getElementById(`not-owned-${category}`);
  }
  if (category_container.innerHTML === "") {
    let i = 0;
    if (!Array.isArray(result[owned][category])) {
      for (let type in result[owned][category]) {
        category_container.innerHTML += `<h4>${type}<span style="float: right">${item_counter[category][type][owned]}/${item_counter[category][type]["total"]}</span></h4>`;
        category_container.innerHTML += `<div class="row-flex">`;
        let category_row = category_container.getElementsByClassName(`row-flex`)[i];
        for (let i in result[owned][category][type]) {
          category_row.innerHTML += getCard(result[owned][category][type][i], category);
        }
        i++;
      }
    } else {
      category_container.innerHTML += `<div class="row-flex">`;
      let category_row = category_container.getElementsByClassName(`row-flex`)[0];
      for (let i in result[owned][category]) {
        category_row.innerHTML += getCard(result[owned][category][i], category);
      }
    }
  }
  $(function () {
    $("img.lazy").Lazy({
      // your configuration goes here
      scrollDirection: "vertical",
      effect: "fadeIn",
      visibleOnly: true,
      onError: function (element) {
        console.log("error loading " + element.data("src"));
      },
    });
  });
}

function addFraction() {
  item_counter = result["counter"];
  ["owned", "not-owned"].forEach((owned) => {
    for (let item_type in item_counter) {
      $(`#${owned}-${item_type}`)
        .prev()
        .find("h3")
        .append(`<span style="float: right">${item_counter[item_type]["summary"][owned]}/${item_counter[item_type]["summary"]["total"]}</span>`);
    }
  });
}

function nFormatter(num, digits) {
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" }
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup.slice().reverse().find(function(item) {
    return num >= item.value;
  });
  return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
}