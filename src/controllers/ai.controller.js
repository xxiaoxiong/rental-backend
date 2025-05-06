import { supabase } from "../supabaseClient.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// 百度文心大模型API配置
const BAIDU_API_KEY = process.env.BAIDU_API_KEY;
const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY;
const ERNIE_BOT_API_URL = "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions";

// 获取百度文心大模型API访问令牌
const getBaiduAccessToken = async () => {
  try {
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`;
    const response = await axios.post(tokenUrl);
    return response.data.access_token;
  } catch (error) {
    console.error("获取百度API访问令牌失败:", error);
    throw new Error("获取AI服务访问令牌失败");
  }
};

/**
 * POST /api/ai/chat - Handle AI chat message
 * This endpoint will process a user's question, potentially create an inquiry,
 * and return a relevant response based on available data.
 */
export const handleChat = async (req, res) => {
  try {
    const { message, user_id, property_id } = req.body;

    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: "Message is required" 
      });
    }

    // For demo purposes, simulate different AI responses
    // In a real implementation, this would use a real AI service
    const simulatedResponse = simulateAiResponse(message, property_id);
    
    // If this is a property inquiry, save it to the database
    if (property_id && user_id) {
      try {
        // Get property details to determine landlord
        const { data: property } = await supabase
          .from("properties")
          .select("landlord_id, title")
          .eq("id", property_id)
          .single();
        
        if (property) {
          // Create inquiry record
          await supabase
            .from("inquiries")
            .insert({
              tenant_id: user_id,
              landlord_id: property.landlord_id,
              property_id: property_id,
              message: message,
              created_at: new Date().toISOString(),
              status: "open",
              is_ai_handled: true,
              ai_response: simulatedResponse.message
            });
        }
      } catch (dbError) {
        console.error("Failed to save inquiry:", dbError);
        // Continue with response even if saving fails
      }
    }

    return res.status(200).json({
      success: true,
      response: simulatedResponse
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "服务器错误" 
    });
  }
};

/**
 * Helper function to simulate AI responses for demonstration
 * In production, this would be replaced with a real AI service call
 */
function simulateAiResponse(message, propertyId) {
  const normalizedMessage = message.toLowerCase();
  
  // Basic pattern matching to simulate AI understanding
  if (normalizedMessage.includes("价格") || normalizedMessage.includes("多少钱") || normalizedMessage.includes("价钱")) {
    return {
      message: "这套房源的租金是每月5500元，包含物业费，水电费需要另算。如果您签一年的合同，可以有95折优惠。您有兴趣看房吗？",
      intent: "price_inquiry"
    };
  }
  
  if (normalizedMessage.includes("看房") || normalizedMessage.includes("预约") || normalizedMessage.includes("参观")) {
    return {
      message: "您可以预约看房，请问您希望哪天来看？我会安排房东与您确认具体时间。",
      intent: "viewing_request",
      suggest_action: "schedule_appointment"
    };
  }
  
  if (normalizedMessage.includes("位置") || normalizedMessage.includes("在哪") || normalizedMessage.includes("地址") || normalizedMessage.includes("交通")) {
    return {
      message: "这套房源位于海淀区西二旗地铁站步行5分钟的位置，周边有永辉超市、711便利店，交通非常便利。",
      intent: "location_inquiry"
    };
  }
  
  if (normalizedMessage.includes("条件") || normalizedMessage.includes("要求") || normalizedMessage.includes("资质")) {
    return {
      message: "租房需要提供您的身份证、工作证明，并且支付一个月押金和一个月房租。如果您有特殊情况，可以与房东协商。",
      intent: "requirements_inquiry"
    };
  }
  
  if (normalizedMessage.includes("家具") || normalizedMessage.includes("设施") || normalizedMessage.includes("家电")) {
    return {
      message: "这套房源配备了基本家具，包括床、衣柜、沙发、餐桌。电器有冰箱、洗衣机、空调和热水器。厨房用具需要自备。",
      intent: "amenities_inquiry"
    };
  }
  
  if (normalizedMessage.includes("合同") || normalizedMessage.includes("签约") || normalizedMessage.includes("租期")) {
    return {
      message: "标准租期为一年，合同会明确说明双方的权利和义务，包括房租支付方式、维修责任等。我们可以在看房后详细讨论合同内容。",
      intent: "contract_inquiry"
    };
  }
  
  // Default response for anything else
  return {
    message: "感谢您的咨询。这套房源是精装修的两居室，位置便利，环境安静。您是想了解这个房源的具体情况吗？或者您有什么特别关注的方面？",
    intent: "general_inquiry"
  };
}
