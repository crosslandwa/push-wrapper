import BaseHTTPServer, SimpleHTTPServer
import ssl
import os


cert_file = os.path.dirname(os.path.realpath(__file__)) + '/server.pem'

if not os.path.isfile(cert_file):
    print 'No certificate found. Creating one now'
    command = 'openssl req -new -x509 -keyout ' + cert_file + ' -out ' + cert_file + ' -days 365 -nodes'
    import subprocess
    process = subprocess.Popen(command.split(), stdout=subprocess.PIPE)
    output = process.communicate()[0]
    print 'Created certificate'

print 'Starting HTTPS server. Connect at https://localhost:4443'
httpd = BaseHTTPServer.HTTPServer(('localhost', 4443), SimpleHTTPServer.SimpleHTTPRequestHandler)
httpd.socket = ssl.wrap_socket (httpd.socket, certfile=cert_file, server_side=True)
httpd.serve_forever()
