storage "file" {
  path = "/vault/data"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = true   # TLS should be terminated by your reverse proxy / load balancer
}

ui            = false
api_addr      = "http://vault:8200"
cluster_addr  = "http://vault:8201"
disable_mlock = true   # required when running in a container without IPC_LOCK
