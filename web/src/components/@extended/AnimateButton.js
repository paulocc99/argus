import { motion } from 'framer-motion';

export default function AnimateButton({ children, type }) {
    switch (type) {
        default:
            return (
                <motion.div whileHover={{ scale: 1 }} whileTap={{ scale: 0.9 }}>
                    {children}
                </motion.div>
            );
    }
}

AnimateButton.defaultProps = {
    type: 'scale'
};
