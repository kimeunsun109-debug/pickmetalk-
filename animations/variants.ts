/** framer-motion 공통 variant */
export const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const hugButton = {
  whileTap: { scale: 0.95 },
  whileHover: { scale: 1.02 },
};
