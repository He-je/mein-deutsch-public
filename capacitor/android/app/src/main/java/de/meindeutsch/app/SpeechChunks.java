package de.meindeutsch.app;
import java.util.ArrayList;

/** Keep engine requests bounded without dropping whitespace or splitting emoji. */
final class SpeechChunks {
    static ArrayList<String> split(String text,int limit){
        if(limit<2)throw new IllegalArgumentException("Speech limit must be at least 2");
        ArrayList<String> chunks=new ArrayList<>();int start=0;
        while(start<text.length()){
            int end=Math.min(text.length(),start+limit);
            if(end<text.length()){
                int space=text.lastIndexOf(' ',end);
                if(space>start)end=space;
                if(Character.isHighSurrogate(text.charAt(end-1))&&Character.isLowSurrogate(text.charAt(end)))end--;
            }
            chunks.add(text.substring(start,end));start=end;
        }
        return chunks;
    }
}
