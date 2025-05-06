import { supabase } from '../supabaseClient.js';

// 获取租房流程
export const getRentalProcess = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('rental_guides')
            .select('*')
            .eq('type', 'process')
            .order('id');

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('获取租房流程失败:', error);
        res.status(500).json({
            success: false,
            error: '获取租房流程失败'
        });
    }
};

// 获取注意事项
export const getRentalTips = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('rental_guides')
            .select('*')
            .eq('type', 'tips')
            .order('id');

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('获取注意事项失败:', error);
        res.status(500).json({
            success: false,
            error: '获取注意事项失败'
        });
    }
};

// 获取常见问题
export const getRentalFAQ = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('rental_guides')
            .select('*')
            .eq('type', 'faq')
            .order('id');

        if (error) throw error;

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('获取常见问题失败:', error);
        res.status(500).json({
            success: false,
            error: '获取常见问题失败'
        });
    }
}; 