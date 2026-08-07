export function hasPermission(user, permission) {
    if (!user) return false;

    if (!permission) return true;

    if (user.role === "Admin") return true;

    return user.permissions?.includes(permission) ?? false;
}