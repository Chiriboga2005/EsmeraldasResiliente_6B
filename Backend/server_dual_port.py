import os
import sys
import socket
import threading
import subprocess

def forward(src, dst):
    try:
        while True:
            data = src.recv(4096)
            if not data:
                break
            dst.sendall(data)
    except Exception:
        pass
    finally:
        try:
            src.close()
        except Exception:
            pass
        try:
            dst.close()
        except Exception:
            pass

def handle_proxy(client, target_host, target_port):
    target = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        target.connect((target_host, target_port))
    except Exception:
        client.close()
        return
    t1 = threading.Thread(target=forward, args=(client, target), daemon=True)
    t2 = threading.Thread(target=forward, args=(target, client), daemon=True)
    t1.start()
    t2.start()

def run_forwarder(from_port=8000, to_port=8080):
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        server.bind(('0.0.0.0', from_port))
        server.listen(100)
        print(f"[DUAL PORT] Proxy activo: Puerto {from_port} redirigiendo a puerto {to_port}...")
        while True:
            client, _ = server.accept()
            threading.Thread(target=handle_proxy, args=(client, '127.0.0.1', to_port), daemon=True).start()
    except Exception as e:
        print(f"[DUAL PORT] Nota: Puerto {from_port} no enlazado ({e}), se mantiene puerto principal {to_port}")

if __name__ == '__main__':
    # Lanzar forwarder en segundo plano para puerto 8000 -> 8080
    proxy_thread = threading.Thread(target=run_forwarder, args=(8000, 8080), daemon=True)
    proxy_thread.start()

    # Ejecutar Django runserver en 8080
    print("[DUAL PORT] Servidor principal iniciando en http://localhost:8080/ ...")
    from django.core.management import execute_from_command_line
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    execute_from_command_line([sys.argv[0], 'runserver', '0.0.0.0:8080', '--noreload'])
