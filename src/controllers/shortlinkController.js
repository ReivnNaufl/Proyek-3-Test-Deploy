import Shortlink from "../models/shortlinkModel.js";
import cryptoRandomString from "crypto-random-string";
import { __dirname } from "../../path.js";
import path from "path";
import { BASE_URL } from "../../path.js";

const createSl = async (req, res) => {
  try {
    const { body } = req;

    // Cek apakah custom URL sudah ada
    if (body.custom && !(await isCustomUnique(body.custom))) {
      res.status(409).send({
        msg: "Custom URL sudah ada!",
      });
      return;
    }

    const id = await uniqueRandomID();
    const custom = body.custom?.trim() || id;
    const title = body.title?.trim();

    await Shortlink.insert(
      id,
      body.destination,
      custom,
      req.session.email,
      title,
      "shortlink"
    );

    res.status(303).redirect(`${BASE_URL}/shortlink/res?id=${id}`);
  } catch (err) {
    console.error("Terjadi error saat membuat shortlink:", err);
    res.status(500).send({
      msg: "Terjadi kesalahan server",
    });
  }
};

const updateSl = async (req, res) => {
  try {
    const { oldUrl, title, custom } = req.body; // Ambil custom dan title dari req.body

    // Cek apakah shortlink dengan original_url ada
    const result = await Shortlink.getBy("short_url", oldUrl);

    if (result.rowCount === 0) {
      res.status(404).send({
        msg: "Shortlink tidak ditemukan!",
      });
      return;
    }

    // Pastikan user memiliki akses ke shortlink ini
    if (result.rows[0]["email"] !== req.session.email) {
      res.status(401).send({
        msg: "Unauthorized",
      });
      return;
    }

    const existingShortlink = result.rows[0];
    let updatedUrl = existingShortlink.short_url;

    // Pastikan custom URL unik
    if (custom && custom !== existingShortlink.short_url) {
      // Cek apakah `newUrl` unik
      if (!(await isCustomUnique(custom))) {
        return res.status(409).send({ msg: "Custom URL sudah ada!" });
      }
      updatedUrl = custom; // Update custom URL jika unik
    }

    // Update shortlink
    await Shortlink.patch(title, custom, oldUrl);
    res.status(200).send({
      msg: "Shortlink updated successfully",
    });
  } catch (err) {
    console.error("Terjadi error saat memperbarui shortlink:", err);
    res.status(500).send({
      msg: "Terjadi kesalahan server",
    });
  }
};

const deleteSl = async (req, res) => {
  try {
    const { body } = req;
    const result = await Shortlink.getBy("short_url", body.short_url);
    // const result = await pool.query(`SELECT * FROM shortlinks WHERE short_url = $1`, [body.short_url]);
    if (result.rowCount === 0) {
      res.status(404).send({
        msg: "Shortlink tidak ditemukan!",
      });
      return;
    }

    if (result.rows[0]["email"] != req.session.email) {
      res.status(403).send({
        msg: "Forbidden",
      });
      return;
    }
    await Shortlink.delete("short_url", body.short_url);
    // await pool.query(`DELETE FROM shortlinks WHERE short_url = $1`, [body.short_url]);
    res.status(200).send({
      msg: "Shortlink berhasil dihapus!",
    });
  } catch (err) {
    console.error("Terjadi error saat menghapus shortlink", err);
    res.status(500).send({
      msg: "Terjadi kesalahan server",
    });
  }
};

const createResult = async (req, res) => {
  try {
    res
      .status(200)
      .sendFile(path.join(__dirname, "src", "views", "generate.html"));
  } catch (err) {
    console.error(
      "Terjadi error saat menampilkan page hasil pembuatan shortlink:",
      err
    );
    res.status(500).send({
      msg: "Terjadi kesalahan server",
    });
  }
};

const getByID = async (req, res) => {
  try {
    const { body } = req;
    const result = await Shortlink.getBy("id_shortlink", req.params.id);
    if (result.rowCount === 0) {
      res.status(404).send({
        msg: "Shortlink tidak ditemukan!",
      });
      return;
    } else if (result.rows[0]["email"] != req.session.email) {
      res.status(403).send({
        msg: "Forbidden",
      });
      return;
    } else {
      res.status(200).send({
        id_shortlink: result.rows[0]["id_shortlink"],
        shortlink_title: result.rows[0]["shortlink_title"],
        long_url: result.rows[0]["long_url"],
        short_url: result.rows[0]["short_url"],
      });
    }
  } catch (err) {
    console.error("Terjadi error saat mengambil shortlink dari database:", err);
    res.status(500).send({
      msg: "Terjadi kesalahan server",
    });
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
      res.redirect(307, `${BASE_URL}/shortlink/not-found`);
      return;
    } else {
      //if false redirect to second web
      res.redirect(
        301,
        `${BASE_URL}/sl/${result.rows[0]["id_shortlink"]}`
      );
      return;
    }
  } catch (err) {
    console.error("Terjadi error saat redirect pertama:", err);
    res.status(500).send({
      msg: "Terjadi kesalahan server",
    });
  }
};

const secondRedirect = async (req, res) => {
  try {
    const result = await Shortlink.getBy("id_shortlink", req.params.id);
    // const result = await pool.query(`SELECT long_url FROM shortlinks WHERE id_shortlink = $1`, [req.params.id]);
    res.redirect(301, result.rows[0]["long_url"]);
  } catch (err) {
    console.error("Terjadi error saat redirect kedua:", err);
    res.status(500).send({
      msg: "Terjadi kesalahan server",
    });
  }
};

const notFound = async (req, res) => {
  try {
    res
      .status(404)
      .sendFile(path.join(__dirname, "src", "views", "pageNotFound.html"));
  } catch (err) {
    console.error("Terjadi error saat menampilkan page not found:", err);
    res.status(500).send({
      msg: "Terjadi kesalahan server",
    });
  }
};

const shortlinkMenu = async (req, res) => {
  try {
    res
      .status(200)
      .sendFile(path.join(__dirname, "src", "views", "shortlink.html"));
  } catch (err) {
    console.error("Terjadi error saat menampilkan page shortlink:", err);
    res.status(500).send({
      msg: "Terjadi kesalahan server",
    });
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
      rows: result.rows,
    });
  } catch (error) {
    console.error("Terjadi error saat menampilkan list shortlink:", error);
    res.status(500).send({
      msg: "Terjadi kesalahan server",
    });
  }
};

export const shorten = async (url, email, custom = null, method) => {
  //tidak ada custom
  if (custom === null) {
    const id = await uniqueRandomID();
    custom = id;
    await Shortlink.insert(id, url, custom, email, null, method);
    return id;
  }

  //custom ada; cek apakah unik
  if (await isCustomUnique(custom)) {
    const id = await uniqueRandomID();
    await Shortlink.insert(id, url, custom, email, null, method);
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
