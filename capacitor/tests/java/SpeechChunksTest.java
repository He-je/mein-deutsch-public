package de.meindeutsch.app;
import java.util.ArrayList;

public class SpeechChunksTest {
    public static void main(String[] args){
        for(String text:new String[]{"", "Hallo Welt.", "Ein langer Satz mit vielen Wörtern. ".repeat(400), "a".repeat(9001), "A😀B ".repeat(2000)}){
            for(int limit:new int[]{2,7,2999,3000}){
                ArrayList<String> chunks=SpeechChunks.split(text,limit);
                if(!String.join("",chunks).equals(text))throw new AssertionError("Text changed");
                for(String chunk:chunks){
                    if(chunk.isEmpty()||chunk.length()>limit)throw new AssertionError("Unbounded chunk");
                    if(Character.isLowSurrogate(chunk.charAt(0))||Character.isHighSurrogate(chunk.charAt(chunk.length()-1)))throw new AssertionError("Split surrogate");
                }
            }
        }
        try{SpeechChunks.split("x",1);throw new AssertionError("Invalid limit accepted");}catch(IllegalArgumentException expected){}
        System.out.println("PASS: native chunk bounds, exact text and Unicode boundaries");
    }
}
