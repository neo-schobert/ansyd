"use client";

import { useNavigationHeight } from "@/contexts/NavigationHeightContext";
import { Dialog, DialogPanel, PopoverGroup } from "@headlessui/react";
import {
  Bars3Icon,
  CodeBracketIcon,
  CpuChipIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import logoIMTA from "../../public/images/logoIMTA.png";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Colors } from "@/contexts/Colors";

export default function NavigationBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigationBarRef = useRef<HTMLDivElement | null>(null);
  const { height, setHeight } = useNavigationHeight();

  useEffect(() => {
    if (navigationBarRef.current) {
      const updateHeight = () => {
        const navigationHeight =
          navigationBarRef.current?.getBoundingClientRect().height || 0;
        setHeight(navigationHeight);
      };

      updateHeight(); // Initial call
      window.addEventListener("resize", updateHeight); // Update on resize
      return () => window.removeEventListener("resize", updateHeight);
    }
  }, [navigationBarRef, setHeight]);

  return (
    <div style={{ backgroundColor: Colors.topGradient }}>
      <div className="navigation-bar fixed w-full z-50" ref={navigationBarRef}>
        <header className="bg-linear-to-b from-white via-gray-100 to-gray-200 border-b border-gray-300 shadow-md">
          <nav
            aria-label="Global"
            className="mx-auto flex max-w-5xl items-center justify-between p-6 lg:px-8"
          >
            <div className="flex lg:flex-1">
              <Link
                href="/"
                className="-m-1.5 p-1.5 flex flex-row space-x-5 items-center rounded-md hover:bg-gray-100 text-base font-semibold leading-6 text-gray-800 hover:shadow-md duration-300 ease-in-out transform hover:scale-105"
              >
                <span className="sr-only">ANSYD</span>
                <Image
                  alt="Logo IMTA"
                  src={logoIMTA}
                  className="h-14 w-auto"
                  width={1000}
                  height={1000}
                />
              </Link>
            </div>

            <div className="flex lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <span className="sr-only">Open Labs menu</span>
                <Bars3Icon aria-hidden="true" className="h-6 w-6" />
              </button>
            </div>

            <PopoverGroup className="hidden lg:flex lg:gap-x-5">
              {["Lab1", "Lab2", "Lab3", "Lab4"].map((lab, i) => (
                <Link
                  key={lab}
                  href={`/lab${i + 1}`}
                  className="flex items-center gap-x-1 rounded-md px-3 py-2 text-base font-semibold leading-6 text-gray-800 hover:bg-gray-100 hover:shadow-md duration-300 ease-in-out transform hover:scale-105"
                >
                  <CpuChipIcon
                    aria-hidden="true"
                    className="h-6 w-6 text-indigo-500"
                  />
                  {lab}
                </Link>
              ))}
            </PopoverGroup>
          </nav>

          {/* Mobile menu */}
          <Dialog
            open={mobileMenuOpen}
            onClose={setMobileMenuOpen}
            className="lg:hidden"
          >
            <div className="fixed inset-0 z-50 bg-black/10" />
            <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto px-6 py-6 bg-white shadow-lg">
              <div className="flex items-center justify-between">
                <Link
                  onClick={() => setMobileMenuOpen(false)}
                  href="/"
                  className="-m-1.5 p-1.5 flex flex-row items-center space-x-5"
                >
                  <CpuChipIcon
                    aria-hidden="true"
                    className="h-6 w-6 text-indigo-500"
                  />
                  <span className="sr-only">ANSYD</span>
                  <Image
                    alt="Logo IMTA"
                    src={logoIMTA}
                    className="h-10 w-auto"
                    width={1000}
                    height={1000}
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="-m-2.5 rounded-md p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <span className="sr-only">Close menu</span>
                  <XMarkIcon aria-hidden="true" className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-gray-200">
                  <div className="space-y-2 py-6">
                    {["Lab1", "Lab2", "Lab3", "Lab4"].map((lab, i) => (
                      <Link
                        key={lab}
                        onClick={() => setMobileMenuOpen(false)}
                        href={`/lab${i + 1}`}
                        className="-mx-3 flex flex-row space-x-5 rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-800 hover:bg-gray-100 hover:shadow-md"
                      >
                        <CpuChipIcon
                          aria-hidden="true"
                          className="h-6 w-6 text-indigo-500"
                        />
                        <div>{lab}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </DialogPanel>
          </Dialog>
        </header>
      </div>
    </div>
  );
}
