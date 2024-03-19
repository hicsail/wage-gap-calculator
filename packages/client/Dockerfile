## NGINX Server
FROM registry.access.redhat.com/ubi7/nginx-120

ADD ./nginx.conf "${NGINX_CONF_PATH}"

ADD ./src/ .

CMD nginx -g "daemon off;"
