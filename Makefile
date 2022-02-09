.PHONY: setup/ubuntu

setup/ubuntu:
	@echo "=> Setup Ubuntu packages"
	sudo apt install -y software-properties-common
	sudo apt install -y build-essential
	sudo add-apt-repository -y ppa:ethereum/ethereum
	sudo apt update
	sudo apt install -y ethereum