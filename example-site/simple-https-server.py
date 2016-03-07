import BaseHTTPServer, SimpleHTTPServer
import ssl
import os

cert_file = os.path.dirname(os.path.realpath(__file__)) + '/server.pem'

httpd = BaseHTTPServer.HTTPServer(('localhost', 4443), SimpleHTTPServer.SimpleHTTPRequestHandler)
httpd.socket = ssl.wrap_socket (httpd.socket, certfile=cert_file, server_side=True)
httpd.serve_forever()
