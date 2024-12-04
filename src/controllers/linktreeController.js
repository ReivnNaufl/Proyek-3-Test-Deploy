import Linktree from "../models/linktreeModel.js";
import Button from "../models/buttonModels.js";
import cryptoRandomString from "crypto-random-string";
import { __dirname } from "../../path.js";
import path from "path";
import { shorten } from "./shortlinkController.js";
import Shortlink from "../models/shortlinkModel.js";
import { URL } from "../../path.js";

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
    console.log(e.message);
    res.status(500).send(e.message);
  }
};

const sendLinktreeData = async (req, res) => {
  try {
    const linktreeData = await Linktree.getBy("id", req.params.id);
    const buttonData = await Button.getBy("linktree_id", req.params.id);
    res.status(200).send({
      linktreeData: linktreeData.rows,
      buttonData: buttonData.rows,
    });
  } catch (e) {
    console.log(e.message);
    res.status(500).send(e.message);
  }
};

const createRoom = async (req, res) => {
  try {
    const { body } = req;
    let custom;

    if (
      (await Shortlink.exists("short_url", body.customUrl)).rows[0]["exists"]
    ) {
      res.status(400).send("custom url already exists");
      return;
    }

    const id = await uniqueRandomID();
    if (body.customUrl.length > 0) {
      custom = body.customUrl;
    } else {
      custom = id;
    }

    const shortUrl = await shorten(
      `${URL}/linktree/room?id=${id}`,
      req.session.email,
      custom,
      "linktree"
    );
    await Linktree.insert(id, body.title, custom, req.session.email, null);
    res
      .status(303)
      .redirect(`${URL}/linktree/room-edit?id=${id}`);
  } catch (e) {
    console.log(e.message);
    res.status(500).send(e.message);
  }
};

const saveContent = async (req, res) => {
  try {
    const { body } = req;
    const id = req.query.id;
    // const result = await Linktree.getBy("id_linktree", id);
    // if (result.rows[0]["email"] != req.session.email) {
    //   res.status(401).send("Unathorized");
    //   return;
    // }
    await Linktree.patch(body.title, body.bio, body.style, id);
    await insertButtons(
      id,
      body.btnArray,
      "muhammad.reivan.tif23@polban.ac.id"
    );
    res.status(200).send("success");
  } catch (e) {
    console.log(e.message);
    res.status(500).send(e.message);
  }
};

const deleteLinktree = async (req, res) => {
  try {
    // const result = await Linktree.getBy("id_linktree", req.params.id);
    // if (result.rowCount === 0) {
    //   res.status(404).send("Not-found");
    //   return;
    // } else if (result.rows[0]["email"] != req.session.email) {
    //   res.status(401).send("Unathorized");
    //   return;
    // }
    await Linktree.delete("id_linktree", req.params.id);
    res.status(200).send("success");
  } catch (e) {
    console.log(e.message);
    res.status(500).send(e.message);
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
      res.status(404).send("Not-found");
      return;
    } else if (result.rows[0]["email"] != req.session.email) {
      res.status(401).send("Unathorized");
      return;
    }

    const buttonData = await Button.getByExceptID("id_linktree", req.params.id);

    res.status(200).send({
      id: result.rows[0]["id_linktree"],
      title: result.rows[0]["linktree_title"],
      bio: result.rows[0]["bio"],
      style: result.rows[0]["style"],
      btnArray: buttonData.rows,
      url: "${URL}/" + result.rows[0]["linktree_url"],
    });
  } catch (e) {
    console.log(e.message);
    res.status(500).send(e.message);
  }
};

const linktreeRoom = async (req, res) => {
  try {
    res
      .status(200)
      .sendFile(path.join(__dirname, "src", "views", "linktreeRoom.html"));
  } catch (e) {
    console.log(e.message);
    res.status(500).send(e.message);
  }
};

const linktreeRoomEdit = async (req, res) => {
  try {
    res
      .status(200)
      .sendFile(path.join(__dirname, "src", "views", "buildold.html"));
  } catch (e) {
    console.log(e.message);
    res.status(500).send(e.message);
  }
};

export default {
  linktreeMenu,
  sendLinktreeData,
  createRoom,
  getLinktree,
  saveContent,
  linktreeRoom,
  linktreeRoomEdit,
  deleteLinktree,
};
