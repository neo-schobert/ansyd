// components/SchemaBlock.tsx
"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Modal, Sheet, ModalClose } from "@mui/joy";
import { motion } from "framer-motion";

interface SchemaBlockProps {
  title: string;
  imageSrc: string;
  alt?: string;
}

export const SchemaBlock: React.FC<SchemaBlockProps> = ({
  title,
  imageSrc,
  alt,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>
      <div
        className="relative w-full h-64 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <Image
          src={imageSrc}
          alt={alt || title}
          fill
          style={{ objectFit: "contain" }}
          className="rounded-md"
        />
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(5px)",
        }}
      >
        <Sheet
          component={motion.div}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
          sx={{
            position: "relative",
            width: "90vw",
            maxWidth: "1200px",
            maxHeight: "90vh",
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: "background.body",
          }}
        >
          <ModalClose
            onClick={() => setOpen(false)}
            sx={{ position: "absolute", top: 8, right: 8, zIndex: 10 }}
          />

          <div className="relative w-full h-[80vh]">
            <Image
              src={imageSrc}
              alt={alt || title}
              fill
              style={{ objectFit: "contain" }}
            />
          </div>
        </Sheet>
      </Modal>
    </div>
  );
};
