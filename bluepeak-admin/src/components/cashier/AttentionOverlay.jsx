import { FaBell, FaClipboardList, FaEnvelope } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../context/NotificationContext";

export default function AttentionOverlay() {

    const navigate = useNavigate();

    const {
        overlayOpen,
        overlayData,
        hideNotification
    } = useNotification();

    if (!overlayOpen) return null;

    const high = overlayData?.priority === "High";

    function viewItem() {

        hideNotification();

        if (overlayData.type === "task") {
            navigate("/cashier/tasks");
        } else {
            navigate("/tasks");
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center">

            <div className="bg-white rounded-3xl shadow-2xl w-[700px] max-w-[95%] overflow-hidden animate-bounce">

                <div className={`p-8 text-white ${high ? "bg-red-600" : "bg-blue-700"}`}>

                    <div className="flex items-center gap-5">

                        <FaBell size={48} />

                        <div>

                            <h1 className="text-4xl font-bold">
                                {overlayData.type === "task"
                                    ? "NEW TASK"
                                    : "NEW MESSAGE"}
                            </h1>

                            <p className="text-lg mt-2">
                                Immediate attention required
                            </p>

                        </div>

                    </div>

                </div>

                <div className="p-8">

                    <div className="flex items-center gap-4 mb-5">

                        {overlayData.type === "task"
                            ? <FaClipboardList size={30}/>
                            : <FaEnvelope size={30}/>}

                        <h2 className="text-3xl font-bold">
                            {overlayData.title}
                        </h2>

                    </div>

                    <p className="text-lg text-gray-700 whitespace-pre-line">
                        {overlayData.message}
                    </p>

                    {overlayData.priority && (

                        <div className="mt-6">

                            <span className={`px-5 py-2 rounded-full text-white font-bold ${
                                high
                                    ? "bg-red-600"
                                    : "bg-yellow-500"
                            }`}>

                                {overlayData.priority} Priority

                            </span>

                        </div>

                    )}

                    <button
                        onClick={viewItem}
                        className="mt-10 w-full bg-blue-700 hover:bg-blue-800 text-white py-5 rounded-xl text-2xl font-bold"
                    >
                        VIEW NOW
                    </button>

                </div>

            </div>

        </div>
    );
}