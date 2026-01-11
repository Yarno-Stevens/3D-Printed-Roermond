import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faUser} from "@fortawesome/free-solid-svg-icons";
import React, {useEffect, useState, useRef} from "react";
import {Link, useNavigate} from "react-router";
import {jwtDecode} from 'jwt-decode';

export default function Header() {

    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const getPersonnelNameFromToken = () => {
        try {
            const token = localStorage.getItem("jwt");
            if (!token) return null;

            const decoded = jwtDecode(token);
            const subData = JSON.parse(decoded.sub);
            return subData.name;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    };

    const getPersonnelAuthFromToken = () => {
        try {
            const token = localStorage.getItem("jwt");
            if (!token) return null;

            const decoded = jwtDecode(token);
            const subData = JSON.parse(decoded.sub);
            return subData.auth;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    };

    useEffect(() => {
        if (window.location.pathname !== "/login") {
            if (localStorage.getItem("jwt") == null) {
                navigate("/login");
            }
        }
    }, [navigate]);

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
        localStorage.removeItem("jwt");
        setIsDropdownOpen(false);
        navigate("/login");
    }

    return (
        <div className="w-full h-full bg-Primary">
            <div className="container mx-auto py-6 px-4 flex flex-col items-center w-full">
                <div className="flex items-center justify-between w-full gap-4">
                    <div className="flex items-center gap-2 w-20 sm:w-60">
                        <Link to="/">
                            <img className="h-10" src="/Logo%203D%20Printer%20los%20wit.png"
                                 alt="3D-Printed-Roermond-Logo"/>
                        </Link>
                    </div>
                    <div className="flex flex-row gap-10 items-center">
                        <Link to="/orders"
                              className="text-text-Primary text-lg font-semibold hover:text-Secondary">Bestellingen</Link>
                        <Link to="/products"
                              className="text-text-Primary text-lg font-semibold hover:text-Secondary">Producten</Link>
                        <Link to="/clients"
                              className="text-text-Primary text-lg font-semibold hover:text-Secondary">Klanten</Link>
                    </div>
                    <div ref={dropdownRef} className="relative flex items-center justify-end gap-2 w-20 sm:w-60">
                        {localStorage.getItem("jwt") ? <>
                            <p className="text-text-Primary text-right font-semibold hidden sm:block">{getPersonnelNameFromToken() ? getPersonnelNameFromToken() : ""}</p>
                            <FontAwesomeIcon
                                aria-label="user-icon"
                                data-testid="user-icon"
                                icon={faUser}
                                className="text-Secondary text-2xl cursor-pointer"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            /></> : ""}

                        {isDropdownOpen && (
                            <div
                                className="absolute right-0 top-full mt-2 w-50 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                <ul className="py-2">
                                    <li onClick={logout}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer">Uitloggen
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}