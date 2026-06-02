//import { useState } from "react";
import { useParams } from "react-router";
import VideoPlayer from "../Components/VideoPlayer";

export default function Player() {
    let video: string|undefined = useParams().videoGuid;
    return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
            {video && <VideoPlayer videoId={video} />}
        </div>
    );
}
 
