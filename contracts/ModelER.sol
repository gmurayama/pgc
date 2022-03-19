// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;

contract ModelER {
    struct Product {
      uint id;
      string name;
      uint price;
    }

    struct Cart {
      uint id;
      uint userId;
    }

    struct CartItem {
      uint cartId;
      uint productId;
    }

    uint private cartCount = 0;

    uint private productsCount = 0;

    // product_id => Product
    mapping(uint => Product) public products;

    // cart_id => Cart
    mapping(uint => Cart) public carts;

    // cart_id => CartItem[]
    mapping(uint => CartItem[]) public cartItems;

    function addProduct(string memory name, uint price) public {
      productsCount++;
      products[productsCount] = Product(productsCount, name, price);
    }

    function createCart(uint userId) public {
      cartCount++;
      carts[cartCount] = Cart(cartCount, userId);
    }

    function addItemToCart(uint cartId, uint productId) public {
      cartItems[cartId].push(CartItem(cartId, productId));
    }

    function showTotal(uint cartId) public view returns (uint) {
      uint total = 0;

      for (uint i = 0; i < cartItems[cartId].length; i++) {
        if (cartItems[cartId][i].cartId == cartId) {
          total += products[cartItems[cartId][i].productId].price;
        }
      }

      return total;
    }
}