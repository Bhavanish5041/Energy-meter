import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('energy-update', (updateData) => {
      setData(updateData);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  return { socket, data };
};

