import Shortlink from "../models/shortlinkModel.js";
import cryptoRandomString from "crypto-random-string";
import { __dirname } from "../../path.js";
import path from "path";
import { URL } from "../../path.js";

const createSl = async (req, res) => {
  try {
    const { body } = req;
    if (!(await isCustomUnique(body.custom))) {
      res.status(400).send({
        msg: "custom sudah ada",
      });
      return;
    } else {
      const id = await uniqueRandomID();
      let custom;
      if (toString(body.custom).length === 0) {
        custom = id;
      } else {
        custom = body.custom;
      }
      await Shortlink.insert(id, body.destination, custom, req.session.email, 'shortlink');
      res.status(303).redirect(`${URL}/shortlink/res?id=${id}`);
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const updateSl = async (req, res) => {
  try {
    const { body } = req;
    let result = await Shortlink.getBy("short_url", body.original_url);
    // result = await pool.query(`SELECT * FROM shortlinks WHERE short_url = $1`, [body.original_url]);

    if (result.rowCount === 0) {
      res.status(404).send("No rows found");
      return;
    }

    if (result.rows[0]["email"] != req.session.email) {
      res.status(401).send("Unathorized");
      return;
    }

    if (isCustomUnique(result.rows[0]["short_url"])) {
      await Shortlink.update(
        "short_url",
        body.new_url,
        "short_url",
        body.original_url
      );
      // await pool.query(`UPDATE shortlinks SET short_url = $1 WHERE short_url = $2`, [body.new_url, body.original_url]);
      res.status(200).send("edit berhasil");
    } else {
      res.status(409).send("not unique");
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const deleteSl = async (req, res) => {
  try {
    const { body } = req;
    const result = await Shortlink.getBy("short_url", body.short_url);
    // const result = await pool.query(`SELECT * FROM shortlinks WHERE short_url = $1`, [body.short_url]);
    if (result.rowCount === 0) {
      res.status(404).send("No rows found");
      return;
    }

    if (result.rows[0]["email"] != req.session.email) {
      res.status(401).send("Unathorized");
      return;
    }
    await Shortlink.delete("short_url", body.short_url);
    // await pool.query(`DELETE FROM shortlinks WHERE short_url = $1`, [body.short_url]);
    res.status(200).send("deleted successfully");
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const createResult = async (req, res) => {
  try {
    res
      .status(200)
      .sendFile(path.join(__dirname, "src", "views", "generate.html"));
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const getByID = async (req, res) => {
  try {
    const { body } = req;
    const result = await Shortlink.getBy("id_shortlink", req.params.id);
    if (result.rowCount === 0) {
      res.status(404).send("Not-found");
      return;
    } else if (result.rows[0]["email"] != req.session.email) {
      res.status(401).send("Unathorized");
      return;
    } else {
      res.status(200).send({
        id_shortlink: result.rows[0]["id_shortlink"],
        long_url: result.rows[0]["long_url"],
        short_url: result.rows[0]["short_url"]
      });
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
};

async function isIDunique(id) {
  const result = await Shortlink.exists("id_shortlink", id);
  // const result = await pool.query(`SELECT EXISTS(SELECT 1 FROM shortlinks WHERE id_shortlink = $1)`, [id]);
  return !result.rows[0]["exists"];
}

async function isCustomUnique(custom) {
  const result = await Shortlink.exists("short_url", custom);
  // const result = await pool.query(`SELECT EXISTS(SELECT 1 FROM shortlinks WHERE short_url = $1)`, [custom]);
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

const firstRedirect = async (req, res) => {
  try {
    const result = await Shortlink.getBy("short_url", req.params.id);
    // const result = await pool.query(`SELECT id_shortlink FROM shortlinks WHERE short_url = $1`, [req.params.id]);

    //check if destination exist
    if (result.rowCount === 0) {
      //if true redirect to not found page
      res.redirect(307, `${URL}/shortlink/not-found`);
      return;
    } else {
      //if false redirect to second web
      res.redirect(
        301,
        `${URL}/sl/${result.rows[0]["id_shortlink"]}`
      );
      return;
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const secondRedirect = async (req, res) => {
  try {
    const result = await Shortlink.getBy("id_shortlink", req.params.id);
    // const result = await pool.query(`SELECT long_url FROM shortlinks WHERE id_shortlink = $1`, [req.params.id]);
    res.redirect(301, result.rows[0]["long_url"]);
  } catch (err) {
    res.status(500).send("Server error");
  }
};

const notFound = async (req, res) => {
  try {
    res
      .status(404)
      .sendFile(path.join(__dirname, "src", "views", "pageNotFound.html"));
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const shortlinkMenu = async (req, res) => {
  try {
    res
      .status(200)
      .sendFile(path.join(__dirname, "src", "views", "shortlink.html"));
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const getShortlinksPaginated = async (req, res) => {
  try {
    const email = req.session.email;
    const result = await Shortlink.getByEmailPaginated(email);

    if (result.rowCount === 0) {
      res.status(404).send("No shortlinks found for the given email");
      return;
    }

    res.status(200).json({
      success: true,
      rows: result.rows
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

export const shorten = async (url, email, custom = null, method) => {
  if (custom === null) {
    const id = await uniqueRandomID();
    custom = id;
    await Shortlink.insert(id, url, custom, email, method);
    return id;
  }

  if (await isCustomUnique(custom)) {
    const id = await uniqueRandomID();
    await Shortlink.insert(id, url, custom, email, method);
    return id;
  } else {
    console.log("custom url already exists");
    return null;
  }
};

export default {
  createSl,
  updateSl,
  deleteSl,
  createResult,
  firstRedirect,
  secondRedirect,
  notFound,
  getByID,
  shortlinkMenu,
  getShortlinksPaginated,
};
