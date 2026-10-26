
/* =========================================
   COMANDIX — Lógica del menú digital
   Prototipo demostrativo
========================================= */

const products = [
  {
    id: 1,
    name: "Helado de Fresa",
    desc: "Delicioso helado artesanal de fresa, suave y cremoso.",
    price: 8,
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=700&q=85"
  },
  {
    id: 2,
    name: "Helado de Chocolate",
    desc: "Intenso sabor a chocolate para los amantes del cacao.",
    price: 8,
    image: "https://images.unsplash.com/photo-1501446529957-6226bd447c46?auto=format&fit=crop&w=700&q=85"
  },
  {
    id: 3,
    name: "Helado de Vainilla",
    desc: "Clásico helado de vainilla, delicado y cremoso.",
    price: 8,
    image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=700&q=85"
  },
  {
    id: 4,
    name: "Mix de la casa",
    desc: "Una combinación especial para probar nuevos sabores.",
    price: 12,
    image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=700&q=85"
  }
];

let order = {};
let selectedProduct = null;
let selectedQty = 1;
let scanner = null;
let scannerRunning = false;
let toastTimer;

const $ = id => document.getElementById(id);

const money = amount =>
  `S/ ${Number(amount).toFixed(2)}`;

/* =========================================
   MODALES
========================================= */

function openModal(id) {
  const modal = $(id);
  if (!modal) return;

  modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal(id) {
  const modal = $(id);
  if (!modal) return;

  modal.classList.remove("open");

  if (!document.querySelector(".backdrop.open")) {
    document.body.style.overflow = "";
  }

  if (id === "scanModal") {
    stopScanner();
  }
}

function openScan() {
  openModal("scanModal");
}

function openMenu() {
  closeModal("scanModal");
  renderMenu();
  openModal("menuModal");
}

/* =========================================
   ALERTAS VISUALES
========================================= */

function toast(message) {
  const el = $("toast");

  if (!el) {
    alert(message);
    return;
  }

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    el.classList.remove("show");
  }, 2800);
}

/* =========================================
   RENDERIZAR MENÚ
========================================= */

function renderMenu() {
  const grid = $("menuGrid");
  if (!grid) return;

  grid.innerHTML = products.map(product => `
    <article
      class="menu-item"
      tabindex="0"
      role="button"
      aria-label="Ver ${product.name}"
      onclick="showDetail(${product.id})"
      onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();showDetail(${product.id})}"
    >
      <img
        src="${product.image}"
        alt="${product.name}"
        loading="lazy"
        onerror="this.style.visibility='hidden'"
      >

      <div class="menu-content">
        <h3>${product.name}</h3>

        <p>${product.desc}</p>

        <div class="item-bottom">
          <span class="price">${money(product.price)}</span>

          <button
            class="add"
            type="button"
            aria-label="Ver detalle"
            onclick="event.stopPropagation();showDetail(${product.id})"
          >+</button>
        </div>
      </div>
    </article>
  `).join("");

  updateSummary();
}

/* =========================================
   DETALLE DEL PRODUCTO
========================================= */

function showDetail(id) {
  selectedProduct = products.find(
    product => product.id === id
  );

  if (!selectedProduct) return;

  selectedQty = 1;

  $("detailImg").src = selectedProduct.image;
  $("detailImg").alt = selectedProduct.name;

  $("detailName").textContent =
    selectedProduct.name;

  $("detailDesc").textContent =
    selectedProduct.desc;

  $("detailPrice").textContent =
    money(selectedProduct.price);

  $("detailQty").textContent = selectedQty;

  openModal("detailModal");
}

function changeQty(amount) {
  selectedQty = Math.max(
    1,
    Math.min(20, selectedQty + amount)
  );

  $("detailQty").textContent = selectedQty;
}

/* =========================================
   AGREGAR AL PEDIDO
========================================= */

function addToOrder() {
  if (!selectedProduct) return;

  const id = selectedProduct.id;

  order[id] = (order[id] || 0) + selectedQty;

  closeModal("detailModal");

  updateSummary();

  toast(`${selectedProduct.name} agregado al pedido.`);
}

/* =========================================
   RESUMEN Y TOTAL
========================================= */

function updateSummary() {
  const count = Object.values(order).reduce(
    (total, quantity) => total + quantity,
    0
  );

  const total = products.reduce(
    (sum, product) =>
      sum + product.price * (order[product.id] || 0),
    0
  );

  if ($("itemCount")) {
    $("itemCount").textContent = count;
  }

  if ($("orderTotal")) {
    $("orderTotal").textContent = money(total);
  }

  if ($("reviewOrder")) {
    $("reviewOrder").disabled = count === 0;
  }
}

/* =========================================
   REVISAR PEDIDO
========================================= */

function reviewOrder() {
  const chosen = products.filter(
    product => order[product.id]
  );

  if (chosen.length === 0) {
    toast("Agrega al menos un producto.");
    return;
  }

  $("reviewLines").innerHTML = chosen.map(product => `
    <div class="line">
      <span>
        ${product.name} × ${order[product.id]}
      </span>

      <strong>
        ${money(product.price * order[product.id])}
      </strong>
    </div>
  `).join("");

  const total = chosen.reduce(
    (sum, product) =>
      sum + product.price * order[product.id],
    0
  );

  $("reviewTotal").textContent = money(total);

  openModal("reviewModal");
}

/* =========================================
   CONFIRMAR PEDIDO DE DEMOSTRACIÓN
========================================= */

function confirmOrder() {
  closeModal("reviewModal");
  closeModal("menuModal");

  order = {};

  updateSummary();

  toast(
    "¡Pedido confirmado! No se envió al negocio."
  );
}

/* =========================================
   ESCÁNER QR CON CÁMARA
   Usa la librería html5-qrcode.
========================================= */

async function startScanner() {
  if (!window.Html5Qrcode) {
    toast("No se pudo cargar el escáner. Prueba el menú demo.");
    return;
  }

  if (scannerRunning) return;

  $("scanPlaceholder").textContent =
    "Solicitando permiso para usar la cámara…";

  try {
    scanner = new Html5Qrcode("qr-reader");

    await scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 230, height: 230 }
      },
      decodedText => {
        stopScanner();
        closeModal("scanModal");
        handleQr(decodedText);
      },
      () => {}
    );

    scannerRunning = true;

    $("scanPlaceholder").style.display = "none";

  } catch (error) {
    $("scanPlaceholder").textContent =
      "No se pudo activar la cámara. Revisa los permisos o sube una imagen.";

    toast(
      "La cámara necesita permiso y HTTPS o localhost."
    );
  }
}

async function stopScanner() {
  if (scanner && scannerRunning) {
    try {
      await scanner.stop();
    } catch (error) {}

    try {
      scanner.clear();
    } catch (error) {}
  }

  scannerRunning = false;
  scanner = null;
}

/* =========================================
   PROCESAR RESULTADO DEL QR
========================================= */

function handleQr(text) {
  try {
    const url = new URL(text);

    if (
      url.searchParams.get("menu") === "iglu" ||
      url.origin === location.origin
    ) {
      openMenu();
      toast("QR leído. Abriendo menú.");
      return;
    }

    if (
      (url.protocol === "https:" ||
       url.protocol === "http:") &&
      confirm(
        "El QR contiene este enlace:\n" +
        url.href +
        "\n\n¿Deseas abrirlo?"
      )
    ) {
      location.href = url.href;
      return;
    }

    toast("El QR no contiene un enlace de menú reconocido.");

  } catch (error) {
    toast("El código leído no parece un enlace válido.");
  }
}

/* =========================================
   LEER QR DESDE UNA FOTOGRAFÍA
========================================= */

if ($("qrFile")) {
  $("qrFile").addEventListener("change", async event => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!window.Html5Qrcode) {
      toast("No se pudo cargar el lector QR.");
      return;
    }

    try {
      const reader = new Html5Qrcode("qr-reader");

      const result = await reader.scanFile(file, true);

      handleQr(result);

    } catch (error) {
      toast(
        "No encontramos un código QR legible en esa imagen."
      );

    } finally {
      event.target.value = "";
    }
  });
}

/* =========================================
   CERRAR MODALES
========================================= */

document.querySelectorAll(".backdrop").forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target === modal) {
      closeModal(modal.id);
    }
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    document.querySelectorAll(".backdrop.open")
      .forEach(modal => closeModal(modal.id));
  }
});

/* =========================================
   INICIALIZACIÓN Y GENERACIÓN DEL QR DEMO
========================================= */

window.addEventListener("load", () => {
  renderMenu();

  const qrPreview = $("qrPreview");

  if (!qrPreview) return;

  const url = new URL(location.href);
  url.searchParams.set("menu", "iglu");

  if (window.QRCode) {
    qrPreview.innerHTML = "";

    new QRCode(qrPreview, {
      text: url.href,
      width: 125,
      height: 125,
      colorDark: "#041a39",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });

  } else if ($("qrImage")) {
    $("qrImage").src =
      "https://api.qrserver.com/v1/create-qr-code/?size=125x125&data=" +
      encodeURIComponent(url.href);
  }

  if (
    new URLSearchParams(location.search).get("menu") === "iglu"
  ) {
    setTimeout(openMenu, 350);
  }
});
