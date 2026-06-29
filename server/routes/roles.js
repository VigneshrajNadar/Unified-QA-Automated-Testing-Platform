const express = require('express');
const router = express.Router();
const Role = require('../models/Role');
const verifyToken = require('../middleware/authMiddleware');

router.get('/', verifyToken, async (req, res) => {
    try {
        const roles = await Role.find();
        res.json(roles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', verifyToken, async (req, res) => {
    try {
        const { name, description, permissions, is_custom } = req.body;
        
        const existing = await Role.findOne({ name });
        if (existing) {
            return res.status(400).json({ error: 'Role with this name already exists' });
        }

        const role = new Role({
            name,
            description,
            permissions: permissions || [],
            is_custom: is_custom !== undefined ? is_custom : true
        });

        await role.save();
        res.status(201).json(role);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { name, description, permissions } = req.body;
        const role = await Role.findById(req.params.id);
        
        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        if (!role.is_custom) {
            return res.status(403).json({ error: 'Cannot modify system roles' });
        }

        if (name) role.name = name;
        if (description !== undefined) role.description = description;
        if (permissions) role.permissions = permissions;

        await role.save();
        res.json(role);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        
        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        if (!role.is_custom) {
            return res.status(403).json({ error: 'Cannot delete system roles' });
        }

        await Role.findByIdAndDelete(req.params.id);
        res.json({ message: 'Role deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
