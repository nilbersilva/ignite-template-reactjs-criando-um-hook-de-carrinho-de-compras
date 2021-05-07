import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';
interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
 
     if (storagedCart) {
       return JSON.parse(storagedCart);
     }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
        var responseStock = await api.get<Stock>(`stock/${productId}`);
        var stock = responseStock.data;
        var product = cart.find(product => product.id === productId);

        if (product)
        {
          //Already on the List, update Amount
          var amount = (product.amount | 0) + 1;
          if(stock.amount < amount)
          {
            toast.error('Quantidade solicitada fora de estoque');
            return;
          }
          await updateProductAmount({productId, amount})
        }
        else {
            var response = await api.get<Product>(`/products/${productId}`)
            if (response.status === 200){
              const product = response.data;
              product.amount = 1;

              if(stock.amount < product.amount)
              {
                toast.error('Quantidade solicitada fora de estoque');
                return;
              }

              var newCart = [...cart,product];
              localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
              setCart(newCart);
            }
            else{
              toast.error('Erro na adição do produto');
            }
        }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
        const productIndex = cart.findIndex(product => product.id === productId);
        if(productIndex >= 0)
        {
          var newCart = cart.filter(product => product.id !== productId);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
          setCart(newCart);
        }
        else {
          toast.error('Erro na remoção do produto');
        }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
       if(amount <= 0) return;

        var responseStock = await api.get<Stock>(`stock/${productId}`);
        var stock = responseStock.data;

        if(stock.amount < amount)
        {
            toast.error('Quantidade solicitada fora de estoque');
            return;
        }

        var newCart = cart.map(product => {
          if (product.id === productId) {
            product.amount = amount;
          }
          return product;
        });
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        setCart(newCart);
    } catch  {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
