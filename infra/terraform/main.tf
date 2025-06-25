resource "yandex_compute_disk" "boot-disk-1" {
  name     = "boot-disk-for-hp-service"
  type     = "network-ssd"
  zone     = "ru-central1-b"
  size     = "40"
  image_id = "fd8juuncoihu8pmo44fb"
}


resource "yandex_compute_instance" "hp-vm-1" {
  name = "honeypot-service-vm"

  resources {
    cores  = 4
    memory = 8
  }

  boot_disk {
    disk_id = yandex_compute_disk.boot-disk-1.id
  }

  network_interface {
    subnet_id          = yandex_vpc_subnet.subnet-1.id
    nat                = true
    nat_ip_address     = yandex_vpc_address.addr.external_ipv4_address[0].address
    security_group_ids = [yandex_vpc_security_group.allow-all.id]
  }


  metadata = {
    user-data = "${file("./meta.txt")}"
  }
}

resource "yandex_vpc_network" "network-1" {
  name = "network1"
}

resource "yandex_vpc_subnet" "subnet-1" {
  name           = "subnet1"
  zone           = "ru-central1-b"
  network_id     = yandex_vpc_network.network-1.id
  v4_cidr_blocks = ["192.168.10.0/24"]
}

resource "yandex_vpc_address" "addr" {
  name                = "hp-public-ip"
  deletion_protection = "false"
  external_ipv4_address {
    zone_id = "ru-central1-b"
  }
}

resource "yandex_vpc_security_group" "allow-all" {
  name        = "allow-all-sg"
  network_id  = yandex_vpc_network.network-1.id
  description = "Security group that allows all traffic"

  ingress {
    protocol       = "ANY"
    description    = "Allow all inbound"
    v4_cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    protocol       = "ANY"
    description    = "Allow all outbound"
    v4_cidr_blocks = ["0.0.0.0/0"]
  }
}


output "internal_ip_address_vm_1" {
  value = yandex_compute_instance.hp-vm-1.network_interface.0.ip_address
}

output "external_ip_address_vm_1" {
  value = yandex_compute_instance.hp-vm-1.network_interface.0.nat_ip_address
}
