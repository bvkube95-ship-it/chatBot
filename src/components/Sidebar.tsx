import type { ChatSession } from "../types";
import { IonIcon } from '@ionic/react';
import { addOutline, chatbubbleOutline } from "ionicons/icons"
import "./styles/Sidebar.css"

interface SidebarProps {
    chats: ChatSession[]
    activeChatId: string | null
    onSelectChat: (id: string) => void
    onNewChat: () => void
}

function Sidebar({
    chats,
    activeChatId,
    onSelectChat,
    onNewChat
}: SidebarProps) {
    return (
        <div className="sidebar">
            <button className="new-chat-btn" onClick={onNewChat}>
                <IonIcon icon={addOutline} className="new-chat-icon" />
                new chat
            </button>
            
            <div className="chat-list">
                {chats.map((chat) => (
                    <button
                        key={chat.id}
                        className={`chat-list-item ${chat.id === activeChatId ? 'active' : ''}`}
                        onClick={() => onSelectChat(chat.id)}
                    >
                        <IonIcon icon={chatbubbleOutline} className="chat-list-icon" />
                        <span className="chat-list-title">{chat.title}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

export default Sidebar