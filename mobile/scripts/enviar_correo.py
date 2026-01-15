import smtplib
import sys
from email.message import EmailMessage

def enviar_codigo(destinatario, codigo):
    remitente = "fitprogimnasio@gmail.com" 
    password = "btwz srzl mvqv wfbe"

    msg = EmailMessage()
    msg.set_content(f"Hola,\n\nTu código de verificación para GYM PRO es: {codigo}\n\nSi no has solicitado esto, ignora este correo.")
    msg['Subject'] = 'Código de Verificación - GYM PRO'
    msg['From'] = remitente
    msg['To'] = destinatario

    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(remitente, password)
        server.send_message(msg)
        server.quit()
        print("Enviado Correctamente")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 2:
        enviar_codigo(sys.argv[1], sys.argv[2])
    else:
        print("Faltan argumentos (email o codigo)")