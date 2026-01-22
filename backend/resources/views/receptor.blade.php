<!DOCTYPE html>
<html>
<head>
    <title>RECEPTOR FINAL</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-dark text-white d-flex align-items-center justify-content-center" style="height: 100vh;">

<div class="text-center border p-5 rounded">
    <h1 id="msg">ESPERANDO QR...</h1>
    <input type="text" id="lector" style="position: absolute; left: -9999px;" autofocus>
    <p class="mt-3 text-secondary">Haz clic aquí si dejas de leer</p>
</div>

<script>
    const lector = document.getElementById('lector');
    const msg = document.getElementById('msg');

    // Forzar foco
    document.addEventListener('click', () => lector.focus());
    setInterval(() => lector.focus(), 500);

    lector.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const contenido = lector.value;
            lector.value = '';
            
            msg.innerText = "PROCESANDO...";
            console.log("Datos enviados:", contenido);

            try {
                // USAMOS LA URL ABSOLUTA PARA EVITAR ERRORES
                const res = await fetch('http://localhost:8000/api/validar-acceso', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: contenido
                });

                const data = await res.json();
                console.log("Respuesta:", data);

                if (data.status === 'success' || data.status === 'usado') {
                    msg.innerText = "✅ ACCESO CONCEDIDO";
                    msg.parentElement.className = "text-center border p-5 rounded bg-success";
                } else {
                    msg.innerText = "❌ ERROR: " + (data.message || "No válido");
                    msg.parentElement.className = "text-center border p-5 rounded bg-danger";
                }
            } catch (err) {
                msg.innerText = "⚠️ ERROR DE RED/API";
                console.error(err);
            }

            // Volver al estado inicial tras 2 segundos
            setTimeout(() => {
                msg.innerText = "ESPERANDO QR...";
                msg.parentElement.className = "text-center border p-5 rounded bg-dark";
            }, 2000);
        }
    });
</script>
</body>
</html>