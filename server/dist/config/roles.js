"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleRights = exports.roles = void 0;
const allRoles = {
    guest: [],
    customer: [],
    staff: [],
    marketer: [],
    hotel_partner: [],
    platform_manager: ['getUsers', 'manageUsers'],
    admin: ['getUsers', 'manageUsers'],
};
exports.roles = Object.keys(allRoles);
exports.roleRights = new Map(Object.entries(allRoles));
