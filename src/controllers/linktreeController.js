import Linktree from "../models/linktreeModel.js";
import Button from "../models/buttonModels.js";
import cryptoRandomString from "crypto-random-string";
import { __dirname } from "../../path.js";
import path from "path";
import { shorten } from "./shortlinkController.js";
import Shortlink from "../models/shortlinkModel.js";
import { title } from "process";
import { url } from "inspector";
import { BASE_URL } from "../../path.js";

async function isIDunique(id) {
  const result = await Linktree.exists("id_linktree", id);
  return !result.rows[0]["exists"];
}

async function uniqueRandomID() {
  let id;
  while (true) {
    id = cryptoRandomString({ length: 4, type: "alphanumeric" });
    if (await isIDunique(id)) {
      break;
    }
  }
  return id;
}

const linktreeMenu = async (req, res) => {
  try {
    res
      .status(200)
      .sendFile(path.join(__dirname, "src", "views", "createlinktree.html"));
  } catch (e) {
    console.error("Terjadi error saat menampilkan menu linktree:", e);
    res.status(500).send({
      msg: "Terjadi kesalahan server",
    });
  }
};

const createRoom = async (req, res) => {
  try {
    const { body } = req;
    let custom;

    if (
      (await Shortlink.exists("short_url", body.customUrl)).rows[0]["exists"]
    ) {
      res.status(409).send({
        msg: "Custom URL sudah digunakan!",
      });
      return;
    }

    const id = await uniqueRandomID();
    if (body.customUrl.length > 0) {
      custom = body.customUrl;
    } else {
      custom = id;
    }

    const shortUrl = await shorten(
      `${BASE_URL}/linktree/room?id=${id}`,
      req.session.email,
      custom,
      "linktree"
    );
    await Linktree.insert(id, body.title, custom, req.session.email, null);
    res
      .status(303)
      .redirect(`${BASE_URL}/linktree/room-edit?id=${id}`);
  } catch (e) {
    console.error("Terjadi error saat membuat room:", e);
    res.status(500).send({
      msg: "Terjadi kesalahan server",
    });
  }
};

const saveContent = async (req, res) => {
  try {
    const { body } = req;
    const id = req.query.id;
    const result = await Linktree.getBy("id_linktree", id);

    if (result.rowCount === 0) {
      res.status(404).send({
        msg: "Linktree tidak ditemukan!",
      });
      return;
    }

    // if (result.rows[0]["email"] != req.session.email) {
    //   res.status(401).send({
    //     msg: "Unauthorized"
    //   });
    //   return;
    // }
    await Linktree.patch(body.title, body.bio, body.style, id);
    await insertButtons(id, body.btnArray, req.session.email);
    res.status(200).send("success");
  } catch (e) {
    console.error("Terjadi error saat menyimpan konten link-in-bio:", e);
    res.status(500).send({
      msg: "Terjadi kesalahan server",
    });
  }
};

const editLinktreeURL = async (req, res) => {
  try {
    const { body } = req;
    const id = req.query.id;
    const result = await Linktree.getBy("id_linktree", id);

    if (result.rowCount === 0) {
      res.status(404).send({
        msg: "Linktree tidak ditemukan!",
      });
      return;
    }
    // else if (result.rows[0]["email"] != req.session.email) {
    //   res.status(403).send({
    //     msg: "Forbidden"
    //   });
    //   return;
    // };

    const url = shorten(
      "http://localhost:8000/linktree/room?id=${id}",
      req.session.email,
      body.url,
      "linktree"
    );
    if (url === null) {
      res.status(500).send({
        msg: "Terjadi kesalahan server",
      });
      return;
    }

    await Linktree.update("linktree_url", body.url, "id_linktree", id);
    res.status(200).send({msg : "success"});
  } catch (e) {
    console.error("Terjadi error saat mengupdate URL link-in-bio:", e);
    res.status(500).send({
      msg: "Terjadi kesalahan server",
    });
  }
};

const deleteLinktree = async (req, res) => {
  try {
    const result = await Linktree.getBy("id_linktree", req.params.id);
    if (result.rowCount === 0) {
      res.status(404).send({
        msg: "Linktree tidak ditemukan!",
      });
      return;
    }
    // else if (result.rows[0]["email"] != req.session.email) {
    //   res.status(403).send({
    //     msg: "Forbidden"
    //   });
    //   return;
    // };
    await Linktree.delete("id_linktree", req.params.id);
    res.status(200).send("success");
  } catch (e) {
    console.error("Terjadi error saat menghapus linktree:", e);
    res.status(500).send({
      msg: "Terjadi kesalahan server",
    });
  }
};

async function insertButtons(id, buttonData, email = null) {
  buttonData.forEach(async (button, index) => {
    let slID = await shorten(button.url, email, null, "linktree");
    if (slID === null) {
      throw new Error("Shortlink error");
    }
    await Button.insert(button.name, index, id, slID);
  });
}

const getLinktree = async (req, res) => {
  try {
    const result = await Linktree.getBy("id_linktree", req.params.id);

    if (result.rowCount === 0) {
      res.status(404).send({
        msg: "Linktree tidak ditemukan!",
      });
      return;
    }
    else if (result.rows[0]["email"] != req.session.email) {
      res.status(403).send({
        msg: "Forbidden",
      });
      return;
    }

    const buttonData = await Button.getByExceptID("id_linktree", req.params.id);

    res.status(200).send({
      id: result.rows[0]["id_linktree"],
      title: result.rows[0]["linktree_title"],
      bio: result.rows[0]["bio"],
      style: result.rows[0]["style"],
      btnArray: buttonData.rows,
      url: `${BASE_URL}/` + result.rows[0]["linktree_url"],
    });
  } catch (e) {
    console.error("Terjadi error saat mengambil konten link-in-bio:", e);
    res.status(500).send({
      msg: "Terjadi kesalahan server",
    });
  }
};

const linktreeRoom = async (req, res) => {
  try {
    res
      .status(200)
      .sendFile(path.join(__dirname, "src", "views", "linktreeRoom.html"));
  } catch (e) {
    console.error("Terjadi error saat menampilkan room:", e);
    res.status(500).send({
      msg: "Terjadi kesalahan server",
    });
  }
};

const linktreeRoomEdit = async (req, res) => {
  try {
    res
      .status(200)
      .sendFile(path.join(__dirname, "src", "views", "buildold.html"));
  } catch (e) {
    console.error("Terjadi error saat menampilkan room edit:", e);
    res.status(500).send({
      msg: "Terjadi kesalahan server",
    });
  }
};

const getLinktreeHistory = async (req, res) => {
  try {
    const result = await Linktree.getHistory(req.session.email);
    if (result.rowCount === 0) {
      res.status(404).send({
        msg: "Linktree tidak ditemukan!",
      });
      return;
    }
    
    res.status(200).send({
      historyArray: result.rows,
    });
  } catch (e) {
    console.error("Terjadi error saat menampilkan linktree history:", e);
    res.status(500).send({
      msg: "Terjadi kesalahan server",
    });
  }
};

export default {
  linktreeMenu,
  createRoom,
  getLinktree,
  saveContent,
  linktreeRoom,
  linktreeRoomEdit,
  deleteLinktree,
  editLinktreeURL,
  getLinktreeHistory,
};
