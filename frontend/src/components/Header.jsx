import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faUser, faRightFromBracket} from "@fortawesome/free-solid-svg-icons";
import React, {useEffect, useState, useRef} from "react";
import {Link, useNavigate} from "react-router";

export default function Header() {
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const username = localStorage.getItem("username");

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
        setIsDropdownOpen(false);
        navigate("/login");
    }

    function sync() {
        setIsDropdownOpen(false);
        navigate("/sync");
    }

    return (
        <div className="w-full h-full bg-Primary">
            <div className="container mx-auto py-6 px-4 flex flex-col items-center w-full">
                <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-2 w-20 sm:w-60">
                        <Link to="/">
                            <img className="h-10" src="/logo-3d-printer-los-wit.png"
                                 alt="3D-Printed-Roermond-Logo"/>
                        </Link>
                    </div>
                    <div className="flex flex-row gap-10 items-center">
                        <Link to="/orders"
                              className="text-text-Primary text-lg font-semibold hover:text-Secondary">Bestellingen</Link>
                        <Link to="/products"
                              className="text-text-Primary text-lg font-semibold hover:text-Secondary">Producten</Link>
                        <Link to="/customers"
                              className="text-text-Primary text-lg font-semibold hover:text-Secondary">Klanten</Link>
                        <Link to="/expenses"
                              className="text-text-Primary text-lg font-semibold hover:text-Secondary">Uitgaven</Link>
                    </div>
                    <div ref={dropdownRef} className="relative flex items-center justify-end gap-2 w-20 sm:w-60">
                        <p className="text-text-Primary text-right font-semibold hidden sm:block">{username}</p>
                        <FontAwesomeIcon
                            aria-label="user-icon"
                            data-testid="user-icon"
                            icon={faUser}
                            className="text-Secondary text-2xl cursor-pointer"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        />
                        {isDropdownOpen && (
                            <div
                                className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg z-50 overflow-hidden min-w-48">
                                <button
                                    className="block w-full text-left px-4 py-3 text-gray-800 hover:bg-gray-100 border-b border-gray-200"
                                    onClick={sync}
                                >
                                    Synchroniseren
                                </button>
                                <button
                                    className="flex items-center gap-2 w-full text-left px-4 py-3 text-gray-800 hover:bg-gray-100"
                                    onClick={logout}
                                >
                                    <FontAwesomeIcon icon={faRightFromBracket} />
                                    Uitloggen
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

