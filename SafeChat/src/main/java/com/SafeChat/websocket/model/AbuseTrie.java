package com.SafeChat.websocket.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AbuseTrie {
    private final TrieNode root;

    public AbuseTrie() {
        root = new TrieNode();
    }

    public void insert(String word) {
        TrieNode node = root;
        for (char ch : word.toLowerCase().toCharArray()) {
            int index = ch - ' ';
            if (node.children[index] == null) {
                node.children[index] = new TrieNode();
            }
            node = node.children[index];
        }
        node.isEndOfWord = true;
    }

    public boolean search(String word) {
        TrieNode node = root;
        for (char ch : word.toLowerCase().toCharArray()) {
            int index = ch - ' ';
            if (node.isEndOfWord) {
                return true;
            }
            if (node.children[index] == null) {
                return false;
            }
            node = node.children[index];
        }
        return node.isEndOfWord;
    }

    private class TrieNode {
        private final TrieNode[] children = new TrieNode[256];
        private boolean isEndOfWord;
    }
}
